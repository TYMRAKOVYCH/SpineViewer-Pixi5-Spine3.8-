<template>
  <el-aside width="380px">
    <el-container
      class=""
    >
      <el-main>
        <el-form>
          <el-form-item>
            <files-upload
              id="spineFiles"
              ref="spineFiles"
              @onChange="$_handleSpineFilesChange"
              @onReset="$_handleSpineFilesDelete"
            />
          </el-form-item>
          <el-form-item class="right">
            <directories-upload
              id="spine"
              ref="spine"
              @onChange="$_handleSpineFilesChange"
              @onReset="$_handleSpineFilesDelete"
            />
          </el-form-item>
        </el-form>
        <p class="small-text">
          Pixi v5.x & Spine 3.8
        </p>
        <br>
        <el-collapse>
          <the-side-panel-spine-props />
        </el-collapse>
        <el-collapse>
          <the-side-panel-debug-events />
        </el-collapse>
        <el-collapse>
          <the-side-panel-stage-props />
        </el-collapse>
        <el-collapse>
          <the-side-panel-slot-containers/>
        </el-collapse>
      </el-main>
    </el-container>
  </el-aside>
</template>

<script>

import { Message } from 'element-ui';
import TheSidePanelSlotContainers from '@/components/TheSidePanelSlotContainers.vue';
import FilesUpload from './FilesUpload.vue';
import TheSidePanelStageProps from './TheSidePanelStageProps.vue';
import TheSidePanelSpineProps from './TheSidePanelSpineProps.vue';
import TheSidePanelDebugEvents from './TheSidePanelDebugEvents.vue';
import DirectoriesUpload from './DirectoriesUpload.vue';

export default {
  name: 'TheSidePanel',
  components: {
    TheSidePanelSlotContainers,
    TheSidePanelDebugEvents,
    TheSidePanelSpineProps,
    TheSidePanelStageProps,
    FilesUpload,
    DirectoriesUpload,
  },
  data() {
    return {};
  },
  methods: {
    $_handleSpineFilesChange(files) {
      this.$store.dispatch('changeVersion');
      this.$store.dispatch('parseFiles', files)
        .catch((reason) => {
          if (this.$store.getters.uploadSource === 'directory') {
            this.$refs.spine.reset();
          } else {
            this.$refs.spineFiles.reset();
          }
          Message({
            type: 'error',
            message: reason,
            showClose: true,
          });
        });
    },
    $_handleSpineFilesDelete() {
      this.$store.dispatch('clearSpine');
    },
  },
};
</script>

<style scoped lang="scss">
  .el-container {
    height: 100%;
  }

  .el-aside {
    padding: 15px;
  }

  .el-form {
    text-align: left;
    display: flex;
    column-gap: 15px;
  }
  .small-text {
    font-size: 80%;
  }
</style>
