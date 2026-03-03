<template>
  <el-collapse-item>
    <div slot="title">
      <i class="el-icon-view"></i>&nbsp;
      <b class="panel-group-title">Animations</b>
    </div>
    <el-form
      size="mini"
      label-width="60px"
    >
      <el-form-item label="Scale">
        <el-slider
          :disabled="!hasSpineData"
          v-model="scale"
          :min="0.01"
          :max="5"
          :step="0.01"
          show-input
          input-size="mini"
        />
      </el-form-item>
      <el-form-item label="Flip">
        <el-col :span="12">
          X:
          <el-switch
            :disabled="!hasSpineData"
            v-model="flipX"
          />
        </el-col>
        <el-col :span="12">
          Y:
          <el-switch
            :disabled="!hasSpineData"
            v-model="flipY"
          />
        </el-col>
      </el-form-item>
      <el-form-item label="Skins">
        <el-col :span="14">
          <el-select
            :disabled="!hasSpineData"
            v-model="currentSkin"
          >
            <el-option
              v-for="skin in skins"
              :key="skin"
              :label="skin"
              :value="skin"
            />
          </el-select>
        </el-col>
        <el-col :span="9" :offset="1">
          <el-tooltip content="Copy skin name">
            <el-button
              icon="el-icon-document-copy"
              :disabled="!hasSpineData || skin === '' || skin === 'default'"
              @click="$_copyCurrentSkinName"
            />
          </el-tooltip>
        </el-col>
      </el-form-item>
      <el-form-item label="Speed">
        <el-slider
          :disabled="!hasSpineData"
          v-model="speed"
          :min="0"
          :max="3"
          :step="0.01"
          show-input
          input-size="mini"
        />
      </el-form-item>
      <el-form-item label="Pose">
        <el-tooltip content="Set Slots to setup pose">
          <el-button
            icon="el-icon-picture-outline"
            :disabled="!hasSpineData"
            @click="$_setSetupPose(TYPE_SLOTS)"
          >
            Slots
          </el-button>
        </el-tooltip>
        <el-tooltip content="Set Bones to setup pose">
          <el-button
            icon="el-icon-s-tools"
            :disabled="!hasSpineData"
            @click="$_setSetupPose(TYPE_BONES)"
          >
            Bones
          </el-button>
        </el-tooltip>
        <br>
        <el-tooltip content="Set to setup pose (skeleton)">
          <el-button
            icon="el-icon-user"
            :disabled="!hasSpineData"
            @click="$_setSetupPose(0)"
          >
            Skeleton
          </el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="Tracks">
        <el-radio-group
          :disabled="!hasSpineData"
          v-model="currentTrack"
        >
          <el-radio-button
            size="small"
            v-for="track in getTracks"
            :key="track"
            :label="track"
            :value="track"
          />
        </el-radio-group>
        &nbsp;
        <br>
        <el-button
          icon="el-icon-circle-close"
          :disabled="!hasSpineData"
          @click="$_resetCurrentTrack"
        >Clear current</el-button>
        <el-button
          icon="el-icon-delete"
          :disabled="!hasSpineData"
          @click="$_resetAllTracks"
        >
          Clear All
        </el-button>
      </el-form-item>
      <el-form-item label="Loop">
        <el-switch
          :disabled="!hasSpineData"
          v-model="isLooped"
        />
      </el-form-item>
      <el-form-item label="Run">
        <el-col :span="14">
          <el-cascader
            v-model="animationAtList"
            :options="animationsList"
            clearable
            placeholder="Empty Animation"
          >
            <template slot-scope="{ node, data }">
              <span>{{ data.label }}</span>
              <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
            </template>
          </el-cascader>
        </el-col>
        <el-col :span="9" :offset="1">
          <el-button-group>
            <el-tooltip content="Copy animation name">
              <el-button
                icon="el-icon-document-copy"
                :disabled="!hasSpineData || animation === ''"
                @click="$_copyCurrentName"
              />
            </el-tooltip>
            <!--<el-tooltip content="Add">
              <el-button
                icon="el-icon-plus"
                :disabled="!hasSpineData || animation === ''"
                @click="$_addAnimation"
              />
            </el-tooltip>-->
            <el-tooltip content="Set animation to selected track">
              <el-button
                icon="el-icon-check"
                :disabled="!hasSpineData"
                @click="$_setAnimation"
              />
            </el-tooltip>
          </el-button-group>
        </el-col>
      </el-form-item>
      <el-form-item label="Multimedia">
        <el-col   :offset=2 >
          <el-tooltip content="Shift anim left">
            <el-button
                icon="el-icon-arrow-left"
                :disabled="!hasSpineData"
                @click="$_shiftAnimationLeft"
            />
          </el-tooltip>
          <el-tooltip content="Pause animation">
            <el-button
                icon="el-icon-video-pause"
                :disabled="!hasSpineData"
                :style="{
                    backgroundColor: isPlaying ? '' : '#e7e7e7',
                    boxShadow: isPlaying ? '' : 'rgba(0, 0, 0, 0.2) 0px 0px 5px 2px inset'
                 }"
                @click="$_pauseAnimation"
            />
          </el-tooltip>
          <el-tooltip content="Shift anim right">
            <el-button
                icon="el-icon-arrow-right"
                :disabled="!hasSpineData"
                @click="$_shiftAnimationRight"
            />
          </el-tooltip>
        </el-col>
      </el-form-item>
    </el-form>
  </el-collapse-item>
</template>

<script>

import { mapGetters } from 'vuex';
import { Message } from 'element-ui';
import {
  eventBus,
  EVENT_ADD_ANIMATION,
  EVENT_SET_ANIMATION,
  EVENT_RESET_TRACK,
  EVENT_RESET_TRACKS,
  TYPE_SLOTS,
  TYPE_BONES,
  EVENT_RESET_SETUP_POSE,
  namesToTree, EVENT_PAUSE_ANIMATION, EVENT_SHIFT_ANIMATION,
} from '../helpers';

export default {
  name: 'TheSidePanelSpineProps',
  computed: {
    isLooped: {
      get() { return this.$store.getters.loop; },
      set(v) { this.$store.commit('setLoop', v); },
    },
    currentTrack: {
      get() { return this.$store.getters.currentTrack; },
      set(v) { this.$store.commit('setCurrentTrack', v); },
    },
    currentAnimation: {
      get() { return [this.$store.getters.currentAnimation]; },
      set(v) { this.$store.commit('setCurrentAnimation', v[1]); },
    },
    currentSkin: {
      get() { return this.$store.getters.currentSkin; },
      set(v) {
        this.$store.commit('setCurrentSkin', v);
        this.skin = v;
      },
    },
    scale: {
      get() { return this.$store.getters.scale; },
      set(v) { this.$store.commit('setScale', v); },
    },
    speed: {
      get() { return this.$store.getters.speed; },
      set(v) { this.$store.commit('setSpeed', v); },
    },
    flipX: {
      get() { return this.$store.getters.flipX; },
      set(v) { this.$store.commit('setFlipX', v); },
    },
    flipY: {
      get() { return this.$store.getters.flipY; },
      set(v) { this.$store.commit('setFlipY', v); },
    },
    animationAtList: {
      get() {
        return this.animation.split('/');
      },
      set(v) {
        this.animation = v.join('/');
      },
    },
    animationsList: {
      get() {
        return namesToTree(this.$store.getters.animations);
      },
    },
    ...mapGetters([
      'getTracks',
      'hasSpineData',
      'skins',
      'isPlaying',
    ]),
  },
  data() {
    return {
      TYPE_SLOTS,
      TYPE_BONES,
      animation: '',
      skin: '',
    };
  },
  methods: {
    $_copyCurrentName() {
      // eslint-disable-next-line no-console
      navigator.permissions.query({ name: 'clipboard-write' })
        .then((result) => {
          if (result.state === 'granted' || result.state === 'prompt') {
            return Promise.resolve();
          }
          return Promise.reject();
        })
        .then(() => navigator.clipboard.writeText(this.animation))
        .then(() => Message({
          type: 'success',
          duration: 2e3,
          showClose: true,
          message: 'Animation name copied',
        }));
    },
    $_copyCurrentSkinName() {
      // eslint-disable-next-line no-console
      navigator.permissions.query({ name: 'clipboard-write' })
        .then((result) => {
          if (result.state === 'granted' || result.state === 'prompt') {
            return Promise.resolve();
          }
          return Promise.reject();
        })
        .then(() => navigator.clipboard.writeText(this.skin))
        .then(() => Message({
          type: 'success',
          duration: 2e3,
          showClose: true,
          message: 'Skin name copied',
        }));
    },
    $_addAnimation() {
      eventBus.$emit(EVENT_ADD_ANIMATION, this.animation);
    },
    $_setAnimation() {
      eventBus.$emit(EVENT_SET_ANIMATION, this.animation);
    },
    $_pauseAnimation() {
      eventBus.$emit(EVENT_PAUSE_ANIMATION, this.animation);
    },
    $_setSetupPose(updateType) {
      eventBus.$emit(EVENT_RESET_SETUP_POSE, updateType);
    },
    $_resetCurrentTrack() {
      eventBus.$emit(EVENT_RESET_TRACK, this.$store.getters.currentTrack);
    },
    $_resetAllTracks() {
      eventBus.$emit(EVENT_RESET_TRACKS);
    },
    $_shiftAnimationRight() {
      eventBus.$emit(EVENT_SHIFT_ANIMATION, 0.008);
    },
    $_shiftAnimationLeft() {
      eventBus.$emit(EVENT_SHIFT_ANIMATION, -0.008);
    },
    // $_toggleAnimation(animationName) {
    //   let newValue = animationName;
    //   if (this.$store.getters.currentAnimation === animationName) {
    //     newValue = '';
    //   }
    //   this.$store.commit('setCurrentAnimation', newValue);
    // },
  },
};
</script>

<style scoped>

</style>
