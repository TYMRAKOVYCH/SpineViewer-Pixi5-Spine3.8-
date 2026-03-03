<template>
  <div
    ref="wrapper"
    class="wrapperOpen"
  >
    <label
      :for="id"
      v-show="!isSelected && !isLoading"
      ref="inputLabel"
    >
    </label>
    <el-tooltip>
      <div slot="content">
        Click to select <br>
        or drag here <br>
        folders
      </div>
      <el-button
        type="primary"
        v-show="!isSelected && !isLoading"
        @click="$_onOpenClick"
      >
        Upload Dir
      </el-button>
    </el-tooltip>

    <div v-show="isLoading">
      <el-button
        :loading="true"
        type="primary"
      >{{loaded}}%</el-button>
    </div>

    <div class="" v-show="isSelected && !isLoading">
      <el-tooltip>
        <div slot="content">
          <div v-for="filename in selectedFileNames"
              :key="filename"
          >{{filename}}</div>
        </div>
        <el-button
          type="primary"
          icon="el-icon-delete"
          @click="reset"
        >
          Clear
        </el-button>
      </el-tooltip>
    </div>

    <el-alert
      v-show="errText !== ''"
      :title="errText"
      type="error"
      v-on:close="errText = ''"
      show-icon>
    </el-alert>

    <input
      ref="input"
      type="file"
      :id="id"
      :accept="accept"
      webkitdirectory
      multiple
      class="app-image-res__input"
      @change="$_handleFileChange"
    />

    <div v-show="files.length > 0 && options.length > 1" class="invisibleMargin"></div>
    <div v-show="files.length > 0 && options.length <= 1" class="invisibleMarginSmall"></div>

    <div class="versionToggle" v-show="files.length > 0">
      <div class="rowRadioButton">
        <p class="versionDescription">Version: </p>
        <label class="radioButtonVersion">
          <input type="radio" id="1.0" name="1.0" value="1.0" v-model="radioCheck"
                 @change="$_uploadNewVersionOfFiles"/>1.0
        </label>
        <label class="radioButtonVersion">
          <input type="radio" id="0.6" name="0.6" value="0.6" v-model="radioCheck"
                 @change="$_uploadNewVersionOfFiles"/>0.6
        </label>
      </div>
    </div>

    <div class="spanNamesContainer" v-show="options.length > 1">
      <p class="spanNameLabel">Spine: </p>
      <Select @change="$_onSpineChange"
        v-model="value" value-key="label" placeholder="Spine name">
        <Option
          v-for="item in options"
          :key="item.label"
          :label="item.label"
          :value="item.value"
        />
      </Select>
    </div>
  </div>
</template>

<script>

import { Select, Option } from 'element-ui';

const endsWith = (extName) => (file) => file.name.toLowerCase().endsWith(extName);

export default {
  name: 'FilesUpload',
  components: {
    Select,
    Option,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      // accept: 'image/png, application/json', // todo" fix mime-type for *.{json,png,atlas}
      accept: '*/*',

      errText: '',
      mainFilename: '',
      files: [],
      isLoading: false,
      loaded: 0,
      radioCheck: '1.0',
      filesFromInput: {},
      options: [],
      value: '',
    };
  },
  computed: {
    isSelected() {
      return this.files.length > 0;
    },
    selectedFileNames() {
      return this.files.map((fileObj) => fileObj.filename);
    },
  },
  created() {
    /** @type {Function[]} */
    this.watchers = [];
  },
  mounted() {
    const preventDefaultEvent = (eventName) => {
      document.addEventListener(eventName, this.$_preventDefaultHandler, false);
    };

    ['dragleave', 'dragenter', 'dragover'].forEach((e) => preventDefaultEvent(e));

    this.$refs.wrapper.addEventListener('drop', this.$_onDrop);

    this.addStoreListener();
  },
  beforeDestroy() {
    const removeDefaultEvent = (eventName) => {
      document.removeEventListener(eventName, this.$_preventDefaultHandler);
    };

    ['dragleave', 'drop', 'dragenter', 'dragover'].forEach((e) => removeDefaultEvent(e));
    this.$_preventDefaultHandler = null;

    this.$refs.wrapper.removeEventListener('drop', this.$_onDrop);

    while (this.watchers.length) {
      const stopWatch = this.watchers.shift();
      stopWatch();
    }
  },
  methods: {
    $_preventDefaultHandler(e) {
      e.preventDefault();
    },
    $_onOpenClick() {
      this.$refs.inputLabel.click();
    },
    $_onSpineChange() {
      this.files = [];
      this.radioCheck = '1.0';
      const self = this;
      const asArray = this.filesFromInput[this.value].desktop;

      Promise.all(asArray.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function onLoaded() {
          self.files.push({
            filename: file.name,
            fileBody: reader.result,
          });
          resolve();
        };

        reader.onerror = reject;
        const normalized = file.name.toLowerCase();
        if (normalized.endsWith('.json') || normalized.endsWith('.atlas')) {
          reader.readAsText(file);
        } else if (normalized.endsWith('.skel')) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsDataURL(file);
        }
      })))
        .then(() => {
          this.$emit('onChange', this.files);
          this.isLoading = false;
          this.loaded = 0;
        });
    },
    $_uploadNewVersionOfFiles() {
      this.files = [];
      const self = this;
      const asArray = this.radioCheck === '1.0'
        ? this.filesFromInput[this.value].desktop
        : this.filesFromInput[this.value].mobile;

      Promise.all(asArray.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function onLoaded() {
          self.files.push({
            filename: file.name,
            fileBody: reader.result,
          });
          resolve();
        };

        reader.onerror = reject;
        const normalized = file.name.toLowerCase();
        if (normalized.endsWith('.json') || normalized.endsWith('.atlas')) {
          reader.readAsText(file);
        } else if (normalized.endsWith('.skel')) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsDataURL(file);
        }
      })))
        .then(() => {
          this.$emit('onChange', this.files);
          this.isLoading = false;
          this.loaded = 0;
        });
    },
    $_handleFileChange(e) {
      /** @type {FileList} */
      this.$store.dispatch('changeUploadSource', 'directory');
      let files;
      if (typeof e.target === 'undefined') {
        files = e;
      } else {
        files = e.target.files;
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < files.length; i++) files[i].filepath = files[i].webkitRelativePath;
      }
      this.errText = '';

      const self = this;

      if (!window.FileReader) {
        this.errText = 'FileReader not found';
        return;
      }
      this.isLoading = true;
      this.loaded = 0;
      let loadedCount = 0;
      let asArray;

      const json = Array
        .from(files)
        .filter((file) => (/\.(json)$/i).test(file.name.toLowerCase()));
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < json.length; i++) {
        const spineName = json[i].name.replace('.json', '');
        const regexp = new RegExp(`${spineName}(_\\d+)?.(skel|atlas|png|jpg|jpeg|webp|avif)$`);
        this.options.push({
          label: spineName,
          value: spineName,
        });
        asArray = Array
          .from(files)
          .filter((file) => (file.filepath.includes('/1') && regexp.test(file.name))
            || file.name.includes(`${spineName}.json`));

        const mobileArray = Array
          .from(files)
          .filter((file) => (file.filepath.includes('/0.6') && regexp.test(file.name))
            || file.name.includes(`${spineName}.json`));

        this.filesFromInput[spineName] = {
          mobile: mobileArray,
          desktop: asArray,
        };
      }

      this.value = json[0].name.replace('.json', '');

      asArray = this.filesFromInput[this.value].desktop;

      if (!asArray.some(endsWith('.json'))) {
        if (!asArray.some(endsWith('.skel'))) {
          this.errText = 'No json/skel file selected';
          return;
        }
      }

      if (!asArray.some(endsWith('.atlas'))) {
        this.errText = 'No atlas file selected';
        return;
      }

      if (!asArray.some(endsWith('.png')) && !asArray.some(endsWith('.jpg'))
        && !asArray.some(endsWith('.jpeg')) && !asArray.some(endsWith('.webp'))
        && !asArray.some(endsWith('.avif'))) {
        this.errText = 'No png|jpg|jpeg|webp|avif file selected';
        return;
      }

      Promise.all(asArray.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function onLoaded() {
          // eslint-disable-next-line no-plusplus
          loadedCount++;
          // eslint-disable-next-line no-mixed-operators
          self.loaded = (loadedCount * 100 / asArray.length).toFixed(2);

          self.files.push({
            filename: file.name,
            fileBody: reader.result,
          });
          resolve();
        };

        reader.onerror = reject;
        const normalized = file.name.toLowerCase();
        if (normalized.endsWith('.json') || normalized.endsWith('.atlas')) {
          reader.readAsText(file);
        } else if (normalized.endsWith('.skel')) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsDataURL(file);
        }
      })))
        .then(() => {
          this.$emit('onChange', this.files);
          this.isLoading = false;
          this.loaded = 0;
        });
    },
    $_onDrop(e) {
      const { items } = e.dataTransfer;
      e.preventDefault();

      this.getFilesDataTransferItems(items).then((files) => {
        this.errText = '';

        const fileList = files;

        if (fileList.length === 0) {
          return false;
        }

        this.reset();

        this.$_handleFileChange(fileList);

        return true;
      });
    },
    getFilesDataTransferItems(dataTransferItems) {
      const files = [];
      return new Promise((resolve) => {
        const entriesPromises = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const it of dataTransferItems) {
          entriesPromises.push(
            this.traverseFileTreePromise(it.webkitGetAsEntry(), null, files),
          );
        }
        Promise.all(entriesPromises).then(() => {
          resolve(files);
        });
      });
    },
    traverseFileTreePromise(item, path = '', folder) {
      return new Promise((resolve) => {
        if (item.isFile) {
          item.file((file) => {
            // eslint-disable-next-line no-param-reassign
            file.filepath = path || `${file.name}`; // save full path
            folder.push(file);
            resolve(file);
          });
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          dirReader.readEntries((entries) => {
            const entriesPromises = [];
            // eslint-disable-next-line no-restricted-syntax
            for (const entr of entries) {
              entriesPromises.push(
                this.traverseFileTreePromise(entr, item.fullPath, folder),
              );
            }
            resolve(Promise.all(entriesPromises));
          });
        }
      });
    },
    reset() {
      this.files = [];

      this.errText = '';
      this.isLoading = false;
      this.loaded = 0;
      this.radioCheck = '1.0';
      this.options = [];

      // this.dataUrl = '';
      // this.filename = '';
      this.$refs.input.value = '';
      this.$emit('onReset');
    },
    addStoreListener() {
      const self = this;
      this.watchers.push(
        this.$store.watch((state) => state.uploadSource,
          () => {
            if (this.$store.getters.uploadSource !== 'directory') {
              self.files = [];

              self.errText = '';
              self.isLoading = false;
              self.loaded = 0;

              // this.dataUrl = '';
              // this.filename = '';
              self.$refs.input.value = '';
            }
          }),
      );
    },
  },
};
</script>

<style scoped lang="scss">
  input[type=file] {
    display: none;
  }
  p[class=versionDescription] {
    padding: 0;
    margin: 0;
  }
  div[class=versionToggle] {
    position: absolute;
    top: 40px;
    left: -133px;
    display: flex;
    flex-direction: column;
  }
  div[class=rowRadioButton] {
    display: flex;
    flex-direction: row;
    column-gap: 10px;
  }
  label[class=radioButtonVersion] {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  div[class=spanNamesContainer] {
    position: absolute;
    top: 65px;
    left: -133px;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  p[class=spanNameLabel] {
    white-space: pre;
  }
  div[class=invisibleMargin] {
    height: 60px;
  }
  div[class=invisibleMarginSmall] {
    height: 20px;
  }
</style>
