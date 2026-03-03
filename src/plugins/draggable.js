/* eslint-disable import/prefer-default-export */
// Taken from https://pixijs.io/examples/#/layers/zorder.js

export const EV_START_DRAG = 'startDrag';
export const EV_ON_DRAG = 'updatePosition';
export const EV_END_DRAG = 'endDrag';

function onMouseDown(ev) {
  if (!this.dragging) {
    this.data = ev.data;
    this.dragging = true;

    this.dragPoint = ev.data.getLocalPosition(this.parent);
    this.dragPoint.x -= this.x;
    this.dragPoint.y -= this.y;
    this.emit(EV_START_DRAG);
  }
}
function onMouseMove() {
  if (this.dragging) {
    const newPosition = this.data.getLocalPosition(this.parent);
    this.x = newPosition.x - this.dragPoint.x;
    this.y = newPosition.y - this.dragPoint.y;
    this.emit(EV_ON_DRAG, {
      x: this.x,
      y: this.y,
    });
  }
}

function onMouseUp() {
  this.dragging = false;
  this.data = null;
  this.emit(EV_END_DRAG);
}

/**
 *
 * @param {PIXI.DisplayObject} el
 */
export const makeDraggableByRightButton = (el) => {
  // eslint-disable-next-line no-param-reassign
  el.interactive = true;
  el
    .on('rightdown', onMouseDown)
    .on('mousemove', onMouseMove)
    .on('rightup', onMouseUp);
};

/**
 *
 * @param {PIXI.DisplayObject} el
 */
export const removeDraggable = (el) => {
  el
    .off('rightdown')
    .off('mousemove')
    .off('rightup');
};
