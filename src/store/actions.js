import {
  parseSpineFiles,
  cleanupSpineData,
  storeSpineData,
} from '../helpers';

export const clearSpine = ({ commit }) => {
  cleanupSpineData();
  storeSpineData(null);
  commit('setSpineData', false);
  commit('cleanup', null);
};

export const changeVersion = ({ commit }) => {
  storeSpineData(null);
  commit('setSpineData', false);
  commit('cleanup', null);
};

export const changeUploadSource = ({ commit }, source) => {
  commit('setUploadSource', source);
};

// eslint-disable-next-line import/prefer-default-export
export const parseFiles = ({ commit }, filesList) => parseSpineFiles(filesList)
  .then((result) => {
    storeSpineData(result.spineData);

    commit('setSpineData', !!result.spineData);
    commit('setCurrentSkin', result.spineData.defaultSkin ? result.spineData.defaultSkin.name : result.spineData.skins[0].name);
  });
