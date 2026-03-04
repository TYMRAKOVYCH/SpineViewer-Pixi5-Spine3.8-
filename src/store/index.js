import Vue from 'vue';
import Vuex from 'vuex';

import * as getters from './getters';
import * as actions from './actions';
import mutations from './mutations';

Vue.use(Vuex);

const state = {
  stageColor: '#3c3c3c',
  stageImg: {
    filename: '',
    fileData: '',
  },
  renderType: 1, // UNKNOWN: 0, WEBGL: 1, CANVAS: 2,
  initialScale: 1,
  scale: 1,
  zoom: 1,
  speed: 1,
  flipX: false,
  flipY: false,
  currentSkin: '',
  hasSpineData: false,
  currentTrack: 0,
  currentAnimation: '',
  loop: false,
  tracks: [...Array(12).keys()],
  // debug events
  showEventStart: true,
  showEventEvent: true,
  showEventComplete: true,
  showEventEnd: false,
  showEventInterrupt: false,
  showEventDispose: false,
  pos: { x: 0, y: 0 },
  uploadSource: '',
  isParsingSpine: false,
  slotContainer: [],
  isSetAnim: false,
  isPlaying: true,
};

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
});
