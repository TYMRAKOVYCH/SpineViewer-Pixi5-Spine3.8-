/* eslint-disable import/prefer-default-export */
/**
 *
 * @param {HTMLCanvasElement} view
 * @param {function(change: number, x: number, y: number, withCtrl: boolean)} callback
 */
export const addWheelListener = (view, callback = () => {}) => {
  view.addEventListener('wheel', (/* MouseWheelEvent */ev) => {
    ev.preventDefault();

    callback(
      // eslint-disable-next-line no-mixed-operators
      (-ev.deltaY * (ev.deltaMode ? 120 : 1) / 500),
      ev.clientX,
      ev.clientY,
      ev.ctrlKey,
    );
  });
};
