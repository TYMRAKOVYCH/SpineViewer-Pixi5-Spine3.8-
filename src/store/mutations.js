export default {
  // multimedia
  setIsPlaying(state, isPlaying) {
    state.isPlaying = isPlaying;
  },
  // slot containers
  setSlotContainer(state, slotContainer) {
    state.slotContainer = slotContainer;
  },
  // stage
  changeStageColor(state, color) {
    state.stageColor = color;
  },
  changeRenderType(state, render) {
    state.renderType = render;
  },
  setZoom(state, value) {
    state.zoom = value;
  },
  changeImgPos(state, pos) {
    state.pos = pos;
  },
  setIsAnimationSet(state, isSet) {
    state.isSetAnim = isSet;
  },
  // customisation
  setScale(state, value) {
    state.scale = value;
  },
  setFlipX(state, isFlipped) {
    state.flipX = isFlipped;
  },
  setFlipY(state, isFlipped) {
    state.flipY = isFlipped;
  },
  setSpeed(state, speed) {
    state.speed = speed;
  },

  // spine props
  setLoop(state, looped) {
    state.loop = looped;
  },
  setCurrentTrack(state, index) {
    state.currentTrack = index;
  },
  setSpineData(state, data) {
    state.hasSpineData = data;
  },
  setCurrentAnimation(state, name) {
    state.currentAnimation = name;
  },
  setCurrentSkin(state, name) {
    state.currentSkin = name;
  },

  // debug events
  setShowStart(state, enabled) {
    state.showEventStart = enabled;
  },
  setShowEvent(state, enabled) {
    state.showEventEvent = enabled;
  },
  setShowComplete(state, enabled) {
    state.showEventComplete = enabled;
  },
  setShowEnd(state, enabled) {
    state.showEventEnd = enabled;
  },
  setShowInterrupt(state, enabled) {
    state.showEventInterrupt = enabled;
  },
  setShowDispose(state, enabled) {
    state.showEventDispose = enabled;
  },
  changeStageImg(state, imgData) {
    state.stageImg.fileData = imgData.fileData;
    state.stageImg.filename = imgData.filename;
  },
  setUploadSource(state, source) {
    state.uploadSource = source;
  },
  // reset to defaults
  cleanup(state) {
    state.spineData = null;
    state.currentTrack = 0;
    state.loop = false;
    state.currentAnimation = '';
    state.currentSkin = '';
    state.scale = 1;
    state.zoom = 1;
    state.speed = 1;
    state.flipX = false;
    state.flipY = false;
  },
};
