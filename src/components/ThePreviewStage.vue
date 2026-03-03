<template>
  <div class="preview-el">
    <resize-observer @notify="handleResize" />
    <canvas ref="previewStageWebGL" class="webgl"></canvas>
    <canvas ref="previewStageCanvas2d" class="canvas2d"></canvas>
    <div class="stageInfo">
      <div id="framerate">FPS: {{ curFPS.toFixed(0) }}</div>
      <div id="render">Use: {{ isCurrentWebGl ? "WebGL" : "Canvas2d" }}</div>
      <!--<div id="cursorPos">x:{{mousePos.x}}, y: {{mousePos.y}}</div>-->
    </div>
    <div v-if="isSetAnimation" class="progress-container">
      <div class="progress-time">
        {{ currentTime.toFixed(2) }}s / {{ totalTime.toFixed(2) }}s
      </div>
    </div>
    <!--    div-->
  </div>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import * as PIXI from 'pixi.js';
import { debounce } from 'debounce';
import { ResizeObserver } from 'vue-resize';
import {
  Tween,
  update as updateTween,
  Easing,
} from 'es6-tween';
import {
  eventBus,
  EVENT_ADD_ANIMATION,
  EVENT_SET_ANIMATION,
  EVENT_RESET_TRACK,
  EVENT_RESET_TRACKS,
  EVENT_RESET_SETUP_POSE,
  TYPE_SLOTS,
  TYPE_BONES,
  getSpineData, EVENT_PAUSE_ANIMATION, EVENT_SHIFT_ANIMATION,
} from '../helpers';
import SpineElement from '../plugins/SpineElement';
import {
  makeDraggableByRightButton,
  EV_ON_DRAG,
  EV_START_DRAG,
  EV_END_DRAG,
} from '../plugins/draggable';
import { addWheelListener } from '../plugins/wheel';

Vue.component('resize-observer', ResizeObserver);

const msgTypeDefault = Symbol('default');
const msgTypeOrange = Symbol('orange');
const msgTypeGreen = Symbol('green');
const msgTypeRed = Symbol('red');

const defineTextStyleByType = (type) => {
  /** @type {PIXI.TextStyleOptions} */
  const style = {
    fill: '#4a86c7',
    fontSize: 26,
    stroke: 'white',
    strokeThickness: 1,
  };

  switch (type) {
    case msgTypeOrange:
      style.fill = '#ffcb0c';
      break;
    case msgTypeGreen:
      style.fill = '#03ff6e';
      break;
    case msgTypeRed:
      style.fill = '#ff6604';
      break;
    default:
      break;
  }

  return style;
};

const progressMargin = 20;
const progressHeight = 15;

export default {
  name: 'ThePreviewStage',
  computed: {
    stageBGColor() {
      return parseInt(this.stageColor.replace(/^#/, ''), 16);
    },
    isSetAnimation() {
      return this.$store.getters.isSetAnim;
    },
    ...mapGetters([
      'stageColor',
      'stageRenderType',
    ]),
  },
  data() {
    return {
      curFPS: 0,
      isCurrentWebGl: false,
      trackEntry: null,
      currentTime: 0,
      totalTime: 0,
    };
  },
  mounted() {
    const generalAppOptions = {
      autoResize: true,
      backgroundColor: this.stageBGColor,
    };

    this.canvasRenderer = new PIXI.Renderer({
      ...generalAppOptions,
      view: this.$refs.previewStageCanvas2d,
      width: this.$refs.previewStageCanvas2d.offsetWidth,
      height: this.$refs.previewStageCanvas2d.offsetHeight,
    });
    this.$refs.previewStageCanvas2d.addEventListener('contextmenu', this.preventDef);

    if (PIXI.utils.isWebGLSupported()) {
      this.webGLRenderer = new PIXI.Renderer({
        ...generalAppOptions,
        view: this.$refs.previewStageWebGL,
        width: this.$refs.previewStageWebGL.offsetWidth,
        height: this.$refs.previewStageWebGL.offsetHeight,
      });
      this.$refs.previewStageWebGL.addEventListener('contextmenu', this.preventDef);
    }

    const stageIsWebGL = this.stageRenderType === PIXI.RENDERER_TYPE.WEBGL;
    const useWebGL = stageIsWebGL && PIXI.utils.isWebGLSupported();
    // eslint-disable-next-line no-underscore-dangle
    window.__PIXI_RENDERER__ = this.webGLRenderer;

    this.stage = new PIXI.Container();
    this.stage.name = 'stage';
    this.wrapper = new PIXI.Sprite();
    this.wrapper.name = 'wrapper';
    this.wrapper.anchor.set(0.5, 0.5);
    this.stage.interactiveChildren = true;
    // this.stage.interactive = true;
    this.stage.addChild(this.wrapper);
    makeDraggableByRightButton(this.wrapper);
    this.progressEl = new PIXI.Graphics();
    this.progressEl.name = 'progress';
    this.stage.addChild(this.progressEl);

    this.progressEventEl = new PIXI.Graphics();
    this.progressEventEl.name = 'progressEv';
    this.stage.addChild(this.progressEventEl);

    this.tracksInfoEl = new PIXI.Text('', {
      fill: '#fff',
      fontSize: 13,
      stroke: '#404040',
      strokeThickness: 2,
    });
    this.tracksInfoEl.anchor.y = 1;
    this.stage.addChild(this.tracksInfoEl);

    this.ticker = new PIXI.Ticker();
    this.ticker.add(this.render, this, PIXI.UPDATE_PRIORITY.LOW);

    this.switchRenderType(useWebGL);
    this.addStoreListeners();
    this.ticker.start();
  },
  created() {
    this.handleResize = debounce(() => {
      if (!this.renderer) return;

      this.renderer.resize(
        this.$el.clientWidth,
        this.$el.clientHeight,
      );

      this.wrapper.position.set(
        this.renderer.screen.width / 2,
        this.renderer.screen.height / 2,
      );
    }, 300);

    /** @type {Function[]} */
    this.watchers = [];
    /** @type {PIXI.CanvasRenderer|PIXI.WebGLRenderer} */
    this.renderer = null;
    /** @type {PIXI.CanvasRenderer} */
    this.canvasRenderer = null;
    /** @type {PIXI.WebGLRenderer} */
    this.webGLRenderer = null;
    /** @type {PIXI.ticker.Ticker} */
    this.ticker = null;
    /** @type {PIXI.interaction.InteractionManager} */
    this.interaction = null;
    /** @type {PIXI.Container} */
    this.stage = null;
    /** @type {PIXI.Sprite} */
    this.wrapper = null;
    /** @type {SpineElement} */
    this.spineEl = null;
    /** PIXI.Graphics */
    this.progressEl = null;
    /** PIXI.Graphics */
    this.progressEventEl = null;
    /** PIXI.Text */
    this.tracksInfoEl = null;
  },
  beforeDestroy() {
    while (this.watchers.length) {
      const stopWatch = this.watchers.shift();
      stopWatch();
    }

    eventBus.$off(EVENT_ADD_ANIMATION, this.addAnimation);
    eventBus.$off(EVENT_SET_ANIMATION, this.setAnimation);
    eventBus.$off(EVENT_RESET_TRACK, this.clearTrack);
    eventBus.$off(EVENT_RESET_TRACKS, this.clearTracks);
    eventBus.$off(EVENT_PAUSE_ANIMATION, this.pauseAnimation);
    eventBus.$off(EVENT_SHIFT_ANIMATION, this.shiftAnimation);

    if (this.spineEl) {
      this.wrapper.removeChild(this.spineEl);
      this.spineEl.destroy();
      this.spineEl = null;
    }

    if (this.ticker) {
      const oldTicker = this.ticker;
      this.ticker = null;
      oldTicker.destroy();
    }

    this.stage.destroy({ children: true });
    this.stage = null;

    this.canvasRenderer.view.removeEventListener('contextmenu', this.preventDef);
    this.canvasRenderer.destroy();
    this.webGLRenderer.view.removeEventListener('contextmenu', this.preventDef);
    this.webGLRenderer.destroy();

    this.interaction = null;
    this.renderer = null;
  },
  methods: {

    preventDef(e) {
      e.preventDefault();
    },
    handleResize() {
    },
    switchRenderType(isWebGL) {
      if (isWebGL) {
        this.$refs.previewStageCanvas2d.style.display = 'none';
        this.$refs.previewStageWebGL.style.display = 'inline';
      } else {
        this.$refs.previewStageWebGL.style.display = 'none';
        this.$refs.previewStageCanvas2d.style.display = 'inline';
      }

      this.isCurrentWebGl = isWebGL;

      // Remove old mouse listener
      if (this.interaction) {
        this.interaction.removeEvents();
      }
      this.renderer = isWebGL ? this.webGLRenderer : this.canvasRenderer;
      this.interaction = this.renderer.plugins.interaction;
      this.interaction.setTargetElement(this.renderer.view, this.renderer.resolution);
      this.handleResize();
    },
    $_trackAnimationProgress() {
      if (!this.spineEl) return;

      const tracksText = [];
      this.spineEl.state.tracks.forEach((trackData) => {
        if (!trackData) return;
        tracksText.push(`${trackData.trackIndex}: ${trackData.animation.name}`);
      });
      // eslint-disable-next-line max-len
      this.tracksInfoEl.position.y = this.renderer.screen.height - progressMargin - progressHeight - 20;
      this.tracksInfoEl.position.x = progressMargin;
      this.tracksInfoEl.text = tracksText.join('\n');

      /** @type {PIXI.spine.core.TrackEntry} */
      const entry = this.spineEl.state.getCurrent(this.$store.getters.currentTrack);
      let percent = 0;
      if (entry) {
        percent = entry.getAnimationTime() / entry.animationEnd;
        const current = entry.getAnimationTime();
        const total = entry.animationEnd;
        this.currentTime = current;
        this.totalTime = total;

        if (percent >= 100) percent = 0;
      }

      this.progressEl.clear();
      this.progressEl.beginFill(0x4a86c7, 0.7);
      this.progressEl.lineStyle(1, 0x808080, 0.7);

      this.progressEl.drawRect(
        progressMargin,
        this.renderer.screen.height - progressMargin - progressHeight,
        ((this.renderer.screen.width - progressMargin * 2) * percent),
        progressHeight,
      );
      this.progressEl.endFill();

      // // eslint-disable-next-line no-console
      // console.log('total', percent);
      //
      // percent = entry.mixDuration === 0 ? 1 : Math.min(1, entry.mixTime / entry.mixDuration);
      // // eslint-disable-next-line no-console
      // console.log('mix', percent);
      // this.progressEl.beginFill(0xff6604, 0.4);
      // this.progressEl.drawRect(
      //   progressMargin,
      //   this.renderer.screen.height - progressMargin - progressHeight,
      //   ((this.renderer.screen.width - progressMargin * 2) * percent),
      //   progressHeight,
      // );
      //
      // this.progressEl.endFill();
    },
    addNewSpine(hasData) {
      if (this.spineEl) {
        this.wrapper.removeChild(this.spineEl);
        this.spineEl.destroy();
        this.spineEl = null;
      }
      if (hasData) {
        this.spineEl = new SpineElement(getSpineData());
        this.$store.commit('setSlotContainer', this.spineEl.slotContainers);
        this.$store.commit('setIsAnimationSet', true);
      }

      if (this.spineEl) {
        this.spineEl.name = 'spineEl';
        this.wrapper.addChild(this.spineEl);

        this.$_addSpineListeners();
      }
    },
    $_addSpineListeners() {
      const showMessage = debounce((text, type = msgTypeDefault) => {
        const label = new PIXI.Text(text, defineTextStyleByType(type));

        label.position.x = 15;
        label.position.y = this.renderer.screen.height - 50;

        this.stage.addChild(label);

        const tween = new Tween({ y: 0, alpha: 1 })
          .to({ y: 300, alpha: 0 }, 2000)
          .easing(Easing.Quadratic.Out)
          .on('update', ({ y, alpha }) => {
            label.pivot.y = y;
            label.alpha = alpha;
          })
          .on('complete', () => this.stage.removeChild(label));

        tween.start();
      }, 25);

      const flags = this.$store.getters;

      this.spineEl.state.addListener({
        start: (entry) => {
          this.progressEventEl.clear();
          if (!flags.showStart) return;
          showMessage(`Started "${entry.animation.name}"`);
        },
        complete: (entry) => {
          this.progressEventEl.clear();
          if (!flags.showComplete) return;
          showMessage(`Completed "${entry.animation.name}"`, msgTypeOrange);
        },
        end(entry) {
          if (!flags.showEnd) return;
          showMessage(`Ended "${entry.animation.name}"`, msgTypeOrange);
        },
        event: (entry, event) => {
          this.progressEventEl.beginFill(0x03ff6e, 0.7);
          this.progressEventEl.lineStyle(1, 0x808080, 0.7);

          const percent = event.time / entry.animationEnd;
          const allWidth = (this.renderer.screen.width - progressMargin * 2);

          this.progressEventEl.drawRect(
            allWidth * percent,
            this.renderer.screen.height - progressMargin - progressHeight,
            5,
            progressHeight,
          );
          this.progressEventEl.endFill();

          if (!flags.showEvent) return;
          const val = event.intValue || event.floatValue || event.stringValue;
          showMessage(
            `Event: "${event.data.name}"`
            + `with value = "${val}" at ${Math.round(event.time * 100) / 100}`,
            msgTypeGreen,
          );
        },
        interrupt(entry) {
          if (!flags.showInput) return;
          showMessage(`Interrupted: ${entry.animation.name}`, msgTypeRed);
        },
        dispose(entry) {
          if (!flags.showDispose) return;
          showMessage(`Disposed: ${entry.animation.name}`, msgTypeRed);
        },
      });
    },
    scaleSpine(value) {
      if (!this.spineEl) return;

      this.spineEl.scale.set(value);
    },
    zoomStage(value) {
      this.wrapper.scale.set(value);
    },
    setSpeed(value) {
      if (!this.spineEl) return;

      this.spineEl.state.timeScale = value;
    },
    $_canPlayAnimation(animationName) {
      if (!this.spineEl) return false;
      if (!animationName) {
        this.spineEl.state.setEmptyAnimation(this.$store.getters.currentTrack);
        return false;
      }
      return true;
    },
    addAnimation(animationName) {
      if (this.$_canPlayAnimation(animationName)) {
        this.spineEl.state.addAnimation(
          this.$store.getters.currentTrack,
          animationName,
          this.$store.getters.loop,
        );
      }
    },
    setAnimation(animationName) {
      if (this.$_canPlayAnimation(animationName)) {
        this.spineEl.state.setAnimation(
          this.$store.getters.currentTrack,
          animationName,
          this.$store.getters.loop,
        );
        this.spineEl.state.timeScale = 1;
        this.$store.commit('setIsPlaying', Boolean(this.spineEl.state.timeScale));
      }
    },
    pauseAnimation(animationName) {
      if (this.$_canPlayAnimation(animationName)) {
        this.spineEl.state.timeScale = this.spineEl.state.timeScale ? 0 : 1;
        this.$store.commit('setIsPlaying', Boolean(this.spineEl.state.timeScale));
      }
    },
    shiftAnimation(deltaSeconds) {
      const { tracks } = this.spineEl.state;

      for (let i = 0; i < tracks.length; i += 1) {
        const trackEntry = tracks[i];
        // eslint-disable-next-line no-continue
        if (!trackEntry) continue;

        trackEntry.trackTime += deltaSeconds;
      }

      this.spineEl.skeleton.updateWorldTransform();
    },
    clearTracks() {
      if (!this.spineEl) return;

      this.spineEl.state.clearTracks();
    },
    clearTrack(index) {
      if (!this.spineEl) return;

      this.spineEl.state.clearTrack(index);
    },
    changeSkin(skinName) {
      if (!this.spineEl) return;

      this.spineEl.skeleton.setSkinByName(skinName);
      this.spineEl.skeleton.setSlotsToSetupPose();
    },
    setToSetupPose(updateType) {
      if (!this.spineEl) return;
      switch (updateType) {
        case TYPE_SLOTS:
          this.spineEl.skeleton.setSlotsToSetupPose();
          break;
        case TYPE_BONES:
          this.spineEl.skeleton.setBonesToSetupPose();
          break;
        default:
          this.spineEl.skeleton.setToSetupPose();
          break;
      }
    },
    flipX(isFlipped) {
      if (!this.spineEl) return;

      this.spineEl.scale.x = isFlipped ? this.spineEl.scale.x * -1 : Math.abs(this.spineEl.scale.x);
    },
    flipY(isFlipped) {
      if (!this.spineEl) return;

      this.spineEl.scale.y = isFlipped ? this.spineEl.scale.y * -1 : Math.abs(this.spineEl.scale.y);
    },
    posStage(value) {
      this.wrapper.position.set(value.x, value.y);
    },
    addStoreListeners() {
      const self = this;

      this.watchers.push(
        this.$store.watch((state) => state.stageColor,
          () => {
            self.webGLRenderer.backgroundColor = self.stageBGColor;
            self.canvasRenderer.backgroundColor = self.stageBGColor;
          }),
        this.$store.watch((state) => state.renderType,
          (type) => self.switchRenderType(type === PIXI.RENDERER_TYPE.WEBGL)),
        this.$store.watch((state) => state.scale, this.scaleSpine),
        this.$store.watch((state) => state.zoom, this.zoomStage),
        this.$store.watch((state) => state.speed, this.setSpeed),
        this.$store.watch((state) => state.hasSpineData, this.addNewSpine),
        this.$store.watch((state) => state.currentSkin, this.changeSkin),
        this.$store.watch((state) => state.flipX, this.flipX),
        this.$store.watch((state) => state.flipY, this.flipY),
        this.$store.watch((state) => state.pos, this.posStage),
        this.$store.watch((state) => state.stageImg.fileData, this.$_setStageTexture),
      );

      eventBus.$on(EVENT_ADD_ANIMATION, this.addAnimation);
      eventBus.$on(EVENT_SET_ANIMATION, this.setAnimation);
      eventBus.$on(EVENT_PAUSE_ANIMATION, this.pauseAnimation);
      eventBus.$on(EVENT_RESET_TRACK, this.clearTrack);
      eventBus.$on(EVENT_RESET_TRACKS, this.clearTracks);
      eventBus.$on(EVENT_RESET_SETUP_POSE, this.setToSetupPose);
      eventBus.$on(EVENT_SHIFT_ANIMATION, this.shiftAnimation);
      eventBus.$on(EVENT_SHIFT_ANIMATION, this.shiftAnimation);

      const addWrapperPosWatcher = () => this.$store.watch(
        (state) => state.pos,
        ({ x, y }) => {
          self.wrapper.x = x;
          self.wrapper.y = y;
        },
        { deep: true },
      );

      let wrapperPosWatcher = addWrapperPosWatcher();
      this.watchers.push(wrapperPosWatcher);

      this.wrapper.on(EV_START_DRAG, () => {
        // remove store watcher
        const idx = this.watchers.indexOf(wrapperPosWatcher);

        if (idx > -1) {
          this.watchers.splice(idx, 1);
        }
        wrapperPosWatcher();
      });

      this.wrapper.on(EV_END_DRAG, () => {
        // add store watcher
        wrapperPosWatcher = addWrapperPosWatcher();
        this.watchers.push(wrapperPosWatcher);
      });

      this.wrapper.on(EV_ON_DRAG, ({ x, y }) => {
        this.$store.commit('changeImgPos', { x, y });
      });

      addWheelListener(this.canvasRenderer.view, this.$_onWheel);

      if (this.webGLRenderer) {
        addWheelListener(this.webGLRenderer.view, this.$_onWheel);
      }
    },
    $_onWheel(change, x, y, ctrl) {
      if (ctrl) {
        this.$store.commit('setScale', this.$store.getters.scale + change);
      } else {
        this.$store.commit('changeImgPos', { x, y });
        this.$store.commit('setZoom', this.$store.getters.zoom + change);
      }
    },
    $_setStageTexture(imgData) {
      if (imgData) {
        const buff = new Image();
        buff.src = imgData;
        PIXI.Texture.addToCache(
          new PIXI.Texture(new PIXI.BaseTexture(buff)),
          'bgImg',
        );
        this.wrapper.texture = PIXI.utils.TextureCache.bgImg;
        const bounds = this.wrapper.getLocalBounds();

        this.$store.commit('changeImgPos', {
          x: Math.round(this.renderer.screen.width / 2 - bounds.width / 2),
          y: Math.round(this.renderer.screen.height / 2 - bounds.height / 2),
        });
      } else {
        this.wrapper.texture = null;
      }
    },
    render() {
      updateTween();
      this.curFPS = this.ticker.FPS;
      this.renderer.render(this.stage);

      this.$_trackAnimationProgress();
    },
  },
};
</script>

<style scoped>
.preview-el {
  position: relative;
}

canvas, .preview-el {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.stageInfo {
  width: 110px;
  position: absolute;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.8);
  font-family: "Lucida Console", Monaco, monospace;
  letter-spacing: 1px;
  font-size: 10px;
  line-height: 1.6;
  pointer-events: none;
  z-index: 2;
  user-select: none;
  left: 0;
  top: 0;
}

.progress-container {
  position: absolute;
  bottom: 10px;
  left: 10px;
  height: 20px;
  width: 100%;
}

.progress-time {
  top: -11px;
  position: absolute;
  white-space: nowrap;
  font-size: 20px;
  margin-top: 4px;
  color: #bdbdbd;
  left: 50%;
  right: 50%;
  font-weight: bold;
}

</style>
