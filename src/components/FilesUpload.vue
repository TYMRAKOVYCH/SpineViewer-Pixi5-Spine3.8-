<template>
  <div
      ref="wrapper"
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
        *.json, *.atlas & *.png files
      </div>
      <el-button
          type="primary"
          v-show="!isSelected && !isLoading"
          @click="$_onOpenClick"
      >
        Upload Files
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
        multiple
        class="app-image-res__input"
        @change="$_handleFileChange"
    />
  </div>
</template>

<script>

const endsWith = (extName) => (file) => file.name.toLowerCase().endsWith(extName);

export default {
  name: 'FilesUpload',
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

    ['dragleave', 'drop', 'dragenter', 'dragover'].forEach((e) => preventDefaultEvent(e));

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
    $_handleFileChange(e) {
      /** @type {FileList} */
      this.$store.dispatch('changeUploadSource', 'files');
      const files = (typeof e.target === 'undefined') ? e : e.target.files;
      this.errText = '';

      const self = this;

      if (!window.FileReader) {
        this.errText = 'FileReader not found';
        return;
      }
      this.isLoading = true;
      this.loaded = 0;
      let loadedCount = 0;
      const asArray = Array
        .from(files)
        .filter((file) => (/\.(json|skel|atlas|png|jpg|webp|avif)$/i).test(file.name.toLowerCase()));

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

      if (!asArray.some(endsWith('.png'))
        && !asArray.some(endsWith('.jpg'))
        && !asArray.some(endsWith('.webp'))
        && !asArray.some(endsWith('.avif'))) {
        this.errText = 'No png|jpg|webp|avif file selected';
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
      e.preventDefault();
      this.errText = '';

      const fileList = e.dataTransfer.files;

      if (fileList.length === 0) {
        return false;
      }

      this.reset();

      this.$_handleFileChange(fileList);

      return true;
    },
    reset() {
      this.files = [];

      this.errText = '';
      this.isLoading = false;
      this.loaded = 0;

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
            if (this.$store.getters.uploadSource !== 'files') {
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
</style>
