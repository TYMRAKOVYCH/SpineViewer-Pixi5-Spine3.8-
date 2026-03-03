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
          Pixi Spine Viewer (Pixi v{{PIXI_VERSION}}
          Pixi-Spine v{{PIXI_SPINE_VERSION}} / 4.1)

          <br>
          <a href="../pixi-spine-viewer-4x-3_7/">Pixi v4.x & Spine 3.7 is here</a><br>
          <a href="../pixi-spine-viewer-5x-3_8/">Pixi v5.x & Spine 3.8 is here</a>
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

import * as PIXI from 'pixi.js';
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
    return {
      PIXI_VERSION: PIXI.VERSION,
      // eslint-disable-next-line no-undef
      PIXI_SPINE_VERSION,
    };
  },
  methods: {
    $_handleSpineFilesChange(files) {
      this.$store.dispatch('changeVersion');
      this.$store.dispatch('parseFiles', files)
        .catch((reason) => {
          this.$refs.spineFiles.reset();
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
