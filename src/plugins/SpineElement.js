import {
  SkeletonData,
  Spine,
  Skeleton,
  AnimationStateData,
  AnimationState,
  RegionAttachment,
  MeshAttachment,
  ClippingAttachment,
} from '@pixi-spine/all-4.1';

export default class SpineElement extends Spine {
  constructor(spineData) {
    super(new SkeletonData());
    try {
      this.changeSkeleton(spineData);
    } catch (err) {
      // eslint-disable-next-line
      console.log(`Spine element cannot be created, name '${spineData.name}'. Error ${err}`);
    }
  }

  changeSkeleton(spineData) {
    this.spineData = spineData;
    this.skeleton = new Skeleton(this.spineData);
    this.skeleton.updateWorldTransform();

    this.stateData = new AnimationStateData(this.spineData);

    this.state = new AnimationState(this.stateData);

    this.createChildren();
    this.autoUpdate = true;
    this.tintRgb = new Float32Array([1, 1, 1]);

    return true;
  }

  createChildren() {
    this.slotContainers = [];

    this.tempClipContainers = [];

    this.removeChildren();

    // eslint-disable-next-line no-plusplus
    for (let i = 0, n = this.skeleton.slots.length; i < n; i++) {
      const slot = this.skeleton.slots[i];
      const attachment = slot.getAttachment();
      const slotContainer = this.newContainer();
      // eslint-disable-next-line no-multi-assign
      slotContainer.name = slot.data.name;
      this.slotContainers.push(slotContainer);
      this.addChild(slotContainer);
      this.tempClipContainers.push(null);

      if (attachment instanceof RegionAttachment) {
        // eslint-disable-next-line no-continue
        if (!attachment.region) continue;
        const spriteName = attachment.region.name;
        const sprite = this.createSprite(slot, attachment, spriteName);
        slot.currentSprite = sprite;
        slot.currentSpriteName = spriteName;
        slotContainer.addChild(sprite);
      } else if (attachment instanceof MeshAttachment) {
        const mesh = this.createMesh(slot, attachment);
        slot.currentMesh = mesh;
        slot.currentMeshName = attachment.name;
        slotContainer.addChild(mesh);
      } else if (attachment instanceof ClippingAttachment) {
        this.createGraphics(slot, attachment);
        slotContainer.addChild(slot.clippingContainer);
        slotContainer.addChild(slot.currentGraphics);
      }
    }
  }

  createSprite(slot, attachment, defName) {
    const origin = super.createSprite(slot, attachment, defName);
    origin.name = attachment.name;
    return origin;
  }

  createGraphics(slot, clip) {
    const origin = super.createGraphics(slot, clip);
    origin.name = clip.name;
    return origin;
  }
}
