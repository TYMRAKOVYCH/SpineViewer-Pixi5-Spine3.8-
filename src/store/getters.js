// stage props
import { getSpineData } from '@/helpers';

// Slot Containers
export const slotContainer = (state) => state.slotContainer;

// multimedia
export const isPlaying = (state) => state.isPlaying;

export const stageColor = (state) => state.stageColor;
export const stageRenderType = (state) => state.renderType;
export const zoom = (state) => state.zoom;
export const pos = (state) => state.pos;
export const posX = (state) => state.pos.x;
export const posY = (state) => state.pos.y;

export const stageImgFile = (state) => state.stageImg.filename;
export const stageImgData = (state) => state.stageImg.fileData;

// customisation for spine
export const scale = (state) => state.scale;
export const flipX = (state) => state.flipX;
export const speed = (state) => state.speed;

export const flipY = (state) => state.flipY;
// spine itself props
export const getTracks = (state) => state.tracks;
export const currentTrack = (state) => state.currentTrack;
export const currentSkin = (state) => state.currentSkin;
export const loop = (state) => state.loop;
export const spineData = () => getSpineData();
export const hasSpineData = (state) => state.hasSpineData;
export const animations = (state) => {
  if (!state.hasSpineData) return [];
  return getSpineData().animations.map((animation) => animation.name);
};

export const skins = (state) => {
  if (!state.hasSpineData) return [];
  return getSpineData().skins.map((skin) => skin.name);
};

export const currentAnimation = (state) => state.currentAnimation;
export const isSetAnim = (state) => state.isSetAnim;

// debug events
export const showStart = (state) => state.showEventStart;
export const showEvent = (state) => state.showEventEvent;
export const showComplete = (state) => state.showEventComplete;
export const showEnd = (state) => state.showEventEnd;
export const showInterrupt = (state) => state.showEventInterrupt;
export const showDispose = (state) => state.showEventDispose;
export const uploadSource = (state) => state.uploadSource;
