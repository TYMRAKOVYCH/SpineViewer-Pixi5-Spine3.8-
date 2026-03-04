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

/** Convert data URL to Blob synchronously (avoids fetch roundtrip) */
const dataURLToBlob = (dataURL) => {
  const commaIdx = dataURL.indexOf(',');
  const header = dataURL.slice(0, commaIdx);
  const base64 = dataURL.slice(commaIdx + 1);
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

/** createImageBitmap options for atlas textures: skip EXIF orientation for speed */
const CREATE_IMAGE_BITMAP_OPTS = { imageOrientation: 'none' };

/**
 * @typedef ParsingSpineResult
 * @property spineData
 * @property spineAtlas
 */
/**
 *
 * @param {{filename:string,fileBody: string|ArrayBuffer,mimeType?:string}[]} filesList
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
  const imageFiles = filesList.filter((fileObj) => {
    const ext = fileObj.filename.toLowerCase();
    return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg')
      || ext.endsWith('.webp') || ext.endsWith('.avif');
  });

  const getBlob = (fileObj) => {
    const body = fileObj.fileBody;
    if (body instanceof ArrayBuffer) {
      let mime = fileObj.mimeType;
      if (!mime) {
        const ext = fileObj.filename.toLowerCase();
        if (ext.endsWith('.png')) mime = 'image/png';
        else if (ext.endsWith('.webp')) mime = 'image/webp';
        else if (ext.endsWith('.avif')) mime = 'image/avif';
        else mime = 'image/jpeg';
      }
      return Promise.resolve(new Blob([body], { type: mime }));
    }
    if (typeof body === 'string' && body.startsWith('data:')) {
      return Promise.resolve(dataURLToBlob(body));
    }
    return fetch(body).then((r) => r.blob());
  };

  const chain = Promise.all(imageFiles.map((fileObj) => getBlob(fileObj)
    .then((blob) => {
      if (typeof createImageBitmap !== 'function') {
        return new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = URL.createObjectURL(blob);
        });
      }
      return createImageBitmap(blob, CREATE_IMAGE_BITMAP_OPTS).catch(() => createImageBitmap(blob));
    })
    .then((source) => {
      const resName = cachedName + fileObj.filename;
      const resource = new PIXI.LoaderResource(resName, '');
      resource.texture = PIXI.Texture.from(source);
      if (source instanceof HTMLImageElement && source.src && source.src.startsWith('blob:')) {
        URL.revokeObjectURL(source.src);
      }
      PIXI.Loader.shared.resources[resName] = resource;
    })))
    .then(() => {
      const adapter = imageLoaderAdapter(PIXI.Loader.shared, cachedName, '', {});

      const onAtlasLoaded = (spineAtlas) => {
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
      };

      // eslint-disable-next-line no-new
      new TextureAtlas(rawAtlas.fileBody, adapter, onAtlasLoaded);
    });

  chain.then(null, reject);
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
