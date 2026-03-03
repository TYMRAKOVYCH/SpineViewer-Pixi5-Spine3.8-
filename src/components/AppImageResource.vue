<template>
  <div
    class="app-image-res"
    :class="[
      sizeClass
    ]"
    ref="wrapper"
  >
    <div class="app-image-res__placeholder" v-if="!imgSelected">
      <label :for="inputId" class="app-image-res__label"></label>
      <div class="app-image-res__placeholder_add">+</div>
      <p class="app-image-res__placeholder_text">
        {{placeholder}}
      </p>
    </div>

    <div class="app-image-res__preview" v-if="imgSelected">
      <el-tooltip
        placement="top"
        :content="filename"
      >
        <img :src="dataUrl" class="app-image-res__preview-img">
      </el-tooltip>
    </div>

    <div class="app-image-res__toolbar" v-if="imgSelected" >
      <el-tooltip
        content="Download"
      >
        <el-button
          plain
          icon="el-icon-download"
          class="xs-mini"
          @click="$_handleBtnDownload"
        />
      </el-tooltip>
      <el-tooltip
        content="Delete"
        >
        <el-button
          plain
          type="danger"
          icon="el-icon-delete"
          class="xs-mini"
          @click="$_handleBtnDelete"
        />
      </el-tooltip>
    </div>

    <input
      ref="input"
      type="file"
      :id="inputId"
      :accept="accept"
      class="app-image-res__input"
      @change="$_handleFileChange"
    />
    <transition name="a-fade-in">
      <div class="app-image-res__err" v-if="errText.length">{{errText}}</div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'app-image-resource',
  props: {
    size: {
      type: String,
    },
    accept: {
      default: 'image/*',
      type: String,
    },
    id: {
      default: '',
      type: String,
    },
    imgSrc: {
      default: '',
      type: String,
    },
    imgFilename: {
      type: String,
      default: '',
    },
    maxSize: {
      default: 5120,
      type: Number,
    },
    placeholder: {
      type: String,
      default: 'No image',
    },
  },
  data() {
    return {
      errText: '',

      inputId: '',
      dataUrl: '',
      filename: '',
    };
  },
  computed: {
    sizeClass() {
      if (this.size) {
        return `app-image-res--${this.size.trim().toLowerCase()}`;
      }
      return '';
    },
    imgSelected() {
      return !!this.dataUrl && !!this.filename;
    },
    maxSizeFormatted() {
      let rst = 0;
      if (this.maxSize < 1024) {
        rst = `${this.maxSize}K`;
      } else {
        rst = `${(this.maxSize / 1024).toFixed(this.maxSize % 1024 > 0 ? 2 : 0)}M`;
      }
      return rst;
    },
  },
  watch: {
    imgSrc(newVal) {
      this.dataUrl = newVal;

      if (!newVal) {
        this.errText = '';
      }
    },
    imgFilename(newVal) {
      this.filename = newVal;

      if (!newVal) {
        this.errText = '';
      }
    },
  },
  mounted() {
    this.inputId = this.id || this.genId();

    if (this.imgSrc) {
      this.dataUrl = this.imgSrc;
    }

    if (this.imgFilename) {
      this.filename = this.imgFilename;
    }

    const preventDefaultEvent = (eventName) => {
      document.addEventListener(eventName, this.$_preventDefaultHandler, false);
    };

    ['dragleave', 'drop', 'dragenter', 'dragover'].forEach((e) => preventDefaultEvent(e));

    this.$refs.wrapper.addEventListener('drop', this.$_onDrop);
  },
  beforeDestroy() {
    const removeDefaultEvent = (eventName) => {
      document.removeEventListener(eventName, this.$_preventDefaultHandler);
    };

    ['dragleave', 'drop', 'dragenter', 'dragover'].forEach((e) => removeDefaultEvent(e));
    this.$_preventDefaultHandler = null;

    this.$refs.wrapper.removeEventListener('drop', this.$_onDrop);
  },
  methods: {
    genId() {
      const hash = Math.random().toString(18).substring(5);
      if (!document.getElementById(hash)) {
        return hash;
      }
      return this.genId();
    },
    $_preventDefaultHandler(e) {
      e.preventDefault();
    },
    $_handleFileChange(e) {
      const file = (typeof e.target === 'undefined') ? e[0] : e.target.files[0];
      this.errText = '';

      const size = Math.floor(file.size / 1024);

      if (size > this.maxSize) {
        this.errText = `File is bigger ${this.maxSizeFormatted}`;
        return;
      }

      const self = this;

      if (!file || !window.FileReader) {
        this.errText = 'FileReader not found';
        return;
      }

      if (/^image/.test(file.type)) {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onloadend = function onLoaded() {
          self.dataUrl = this.result;
          self.$emit('onChange', self.dataUrl, file.name);
        };
      }
      this.filename = file.name;
    },
    $_handleBtnDownload() {
      const a = document.createElement('a');
      a.download = this.filename;
      a.href = this.dataUrl;
      a.click();
    },
    $_handleBtnDelete() {
      this.reset();
    },
    $_onDrop(e) {
      e.preventDefault();
      if (this.readonly) return false;
      this.errText = '';
      const fileList = e.dataTransfer.files;

      if (fileList.length === 0) {
        return false;
      }

      if (fileList.length > 1) {
        this.errText = 'No multi upload';
        return false;
      }

      this.$_handleFileChange(fileList);

      return true;
    },
    reset() {
      this.errText = '';

      this.dataUrl = '';
      this.filename = '';
      this.$refs.input.value = '';
      this.$emit('onReset');
    },
  },
};
</script>

<style scoped lang="scss">
  .app-image-res {
    border: dashed 2px gray;
    position: relative;
    display: inline-block;
    /*overflow: hidden;*/
    /*font-size: .8em;*/

    // middle
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.117647), 0 1px 4px rgba(0, 0, 0, 0.117647);
    width: 100px;
    height: 100px;
    border-radius: 8px;

    /*will-change: transform;*/
    /*transition: transform 0.2s;*/

    &:hover {
      /*transform: scale(1.05);*/
      box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12),
      0 2px 4px -1px rgba(0, 0, 0, 0.3);
    }

    &--small {
      width: 50px;
      height: 50px;
      border-radius: 4px;

      .app-image-res__placeholder {
        font-size: .7em;
        line-height: 1.2em;
      }

    }

    &--large {
      width: 150px;
      height: 150px;
      border-radius: 4px;
      .app-image-res__placeholder {
        font-size: 1.4em;
      }
    }

    &__placeholder {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      padding: 2px;
      color: #aaa;
      /*width: 94%;*/
      text-align: center;
      line-height: 1.2em;

      cursor: pointer;

      &_add {
        margin: 5px;
        font-size: 3em;
        font-weight: bold;
        color: #606060;
      }

      &_text {

      }
    }

    &__preview {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      overflow: hidden;
      background-color: rgba(128, 128, 128, 0.25);
    }

    &__preview-img {
      position: relative;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
      width: 100%
    }

    &__input {
      position: absolute;
      top: -1000px;
    }

    &__label {
      cursor: pointer;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1;
    }

    &__err {
      color: #e55;
      font-size: 12px;
      position: absolute;
      bottom: 0;
      width: 100%;
      text-align: center;
    }

    &__toolbar {
      position: absolute;
      min-width: 80px;
      padding: 0 2px;
      bottom: -30px;
      will-change: opacity;
      transition: opacity 0.2s linear;
      z-index: 2;
      opacity: 0;
      .xs-mini {
        padding: 4px 8px;
      }
      .xs-mini + .xs-mini {
        margin-left: 4px;
      }
    }

    &:hover {
      .app-image-res__toolbar {
        opacity: 1;
      }
    }
  }

  .a-fade-in {
    &-enter-active, &-leave-active {
      will-change: opacity;
      transition: opacity .5s;
    }
    &-enter, &-leave-to {
      opacity: 0;
    }
  }
</style>
