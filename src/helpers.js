import * as PIXI from 'pixi.js-legacy';
import Vue from 'vue';
import {
  SkeletonJson,
  SkeletonBinary,
  TextureAtlas,
  AtlasAttachmentLoader,
} from '@pixi-spine/all-3.8';
import { imageLoaderAdapter } from '@pixi-spine/loader-base';

export const EVENT_ADD_ANIMATION = 'EVENT_ADD_ANIMATION';
export const EVENT_SET_ANIMATION = 'EVENT_SET_ANIMATION';
export const EVENT_PAUSE_ANIMATION = 'EVENT_PAUSE_ANIMATION';
export const EVENT_RESET_TRACK = 'EVENT_RESET_TRACK';
export const EVENT_RESET_TRACKS = 'EVENT_RESET_TRACKS';
export const EVENT_RESET_SETUP_POSE = 'EVENT_RESET_SETUP_POSE';
export const EVENT_SHIFT_ANIMATION = 'EVENT_SHIFT_ANIMATION';

export const TYPE_SLOTS = 1;
export const TYPE_BONES = 2;

export const eventBus = new Vue();

/**
 * Find file with extension
 * @param {string[]}filesList
 * @param {string} extName
 */
const findByExtension = (filesList, extName) => {
  const result = filesList.find((fileObj) => fileObj.filename.toLowerCase().endsWith(extName));
  if (!result) throw new Error(`File with extension ${extName} no found`);
  return result;
};

/**
 * @typedef ParsingSpineResult
 * @property spineData
 * @property spineAtlas
 */
/**
 *
 * @param {{filename:string,fileBody: string}[]} filesList
 * @returns {Promise<ParsingSpineResult>}
 */
export const parseSpineFiles = (filesList) => new Promise((resolve, reject) => {
  const rawAtlas = findByExtension(filesList, 'atlas');

  let rawSpineDataJson;
  let rawSpineDataSkel;
  try {
    rawSpineDataJson = findByExtension(filesList, 'json');
  } catch (e) {
    rawSpineDataSkel = findByExtension(filesList, 'skel');
  }

  let rawSpineData;
  let parser;
  let dataToParse;

  if (rawSpineDataJson) {
    rawSpineData = rawSpineDataJson;
    dataToParse = rawSpineData.fileBody;
    parser = new SkeletonJson(null);
  } else if (rawSpineDataSkel) {
    rawSpineData = rawSpineDataSkel;
    dataToParse = rawSpineData.fileBody;
    parser = new SkeletonBinary(null);
    if (dataToParse instanceof ArrayBuffer) {
      dataToParse = new Uint8Array(dataToParse);
    }
  }

  const cachedName = `${rawSpineData.filename}_atlas_page_`;
  filesList
    .filter((fileObj) => fileObj.filename.toLowerCase()
      .endsWith('.png')
      || fileObj.filename.toLowerCase()
        .endsWith('.jpg')
      || fileObj.filename.toLowerCase()
        .endsWith('.webp') || fileObj.filename.toLowerCase()
      .endsWith('.avif'))
    .forEach((fileObj) => {
      const resName = cachedName + fileObj.filename;
      const resource = new PIXI.LoaderResource(resName, '');
      resource.texture = PIXI.Texture.from(fileObj.fileBody);
      PIXI.Loader.shared.resources[resName] = resource;
    });
  const adapter = imageLoaderAdapter(PIXI.Loader.shared, cachedName, '', {});

  // eslint-disable-next-line no-new
  new TextureAtlas(rawAtlas.fileBody, adapter, ((spineAtlas) => {
    parser.attachmentLoader = new AtlasAttachmentLoader(spineAtlas);

    let spineData;
    try {
      spineData = parser.readSkeletonData(dataToParse);
    } catch (e) {
      reject(e);
      return;
    }

    resolve({
      spineData,
      spineAtlas,
    });
  }));
});

export const cleanupSpineData = () => {
  PIXI.Loader.shared.resources = {};
};

/**
 * @typedef ParserTreeItem
 * @param {string} value
 * @param {string} label
 * @param {ParserTreeItem} children
 */

/**
 *
 * @param {ParserTreeItem[]} items
 * @return {ParserTreeItem[]}
 */
const removeEmptyChild = (items) => items.map((item) => {
  if (!item.children.length) {
    // eslint-disable-next-line no-param-reassign
    delete item.children;
  } else {
    // eslint-disable-next-line no-param-reassign
    item.children = removeEmptyChild(item.children);
  }
  return item;
});

/**
 *
 * @param {string[]} paths
 * @return {ParserTreeItem[]}
 */
export const namesToTree = (paths) => {
  const parsedItems = paths
    .splice(0)
    .sort()
    .sort((a, b) => {
      if (a.includes('/') && b.includes('/')) {
        return a.localeCompare(b);
      }
      if (a.includes('/')) {
        return -1;
      }
      if (b.includes('/')) {
        return 1;
      }
      return a.localeCompare(b);
    })
    .reduce((items, path) => {
      const names = path.split('/');
      names.reduce((q, name) => {
      // eslint-disable-next-line no-shadow
        let item = q.find((o) => o.value === name);
        if (!item) {
          q.push(item = {
            value: name,
            label: name,
            children: [],
          });
        }
        return item.children;
      }, items);
      return items;
    }, []);

  return removeEmptyChild(parsedItems);
};

const pureStore = {
  spineData: null,
};

export function storePureObj(key, value) {
  pureStore[key] = value;
}

export function getPureObj(key) {
  return pureStore[key];
}

export function storeSpineData(spineData) {
  pureStore.spineData = spineData;
}

export function getSpineData() {
  return pureStore.spineData;
}
