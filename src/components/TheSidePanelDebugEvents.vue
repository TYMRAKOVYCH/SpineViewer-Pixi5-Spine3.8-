<template>
  <el-collapse-item>
    <div slot="title">
      <i class="el-icon-news"></i>&nbsp;
      <b class="panel-group-title">Events</b>
    </div>
    <el-form
      size="mini"
      label-width="100px"
    >
      <el-form-item label="Start">
        <el-switch
            v-model="showStart"
            :disabled="!hasSpineData"
          />
      </el-form-item>
      <el-form-item label="End">
        <el-switch
            v-model="showEnd"
            :disabled="!hasSpineData"
          />
      </el-form-item>
      <el-form-item label="Complete">
        <el-switch
            v-model="showComplete"
            :disabled="!hasSpineData"
          />
      </el-form-item>
      <el-form-item label="Event">
        <el-switch
            v-model="showEvent"
            :disabled="!hasSpineData"
          />
      </el-form-item>
      <el-form-item label="Interrupt">
        <el-switch
            v-model="showInterrupt"
            :disabled="!hasSpineData"
          />
      </el-form-item>
      <el-form-item label="Dispose">
        <el-switch
            v-model="showDispose"
            :disabled="!hasSpineData"
          />
      </el-form-item>
    </el-form>
  </el-collapse-item>
</template>

<script>

import { mapGetters } from 'vuex';

export default {
  name: 'TheSidePanelDebugEvents',
  computed: {
    showStart: {
      get() { return this.$store.getters.showStart; },
      set(v) { this.$store.commit('setShowStart', v); },
    },
    showEvent: {
      get() { return this.$store.getters.showEvent; },
      set(v) { this.$store.commit('setShowEvent', v); },
    },
    showComplete: {
      get() { return this.$store.getters.showComplete; },
      set(v) { this.$store.commit('setShowComplete', v); },
    },
    showEnd: {
      get() { return this.$store.getters.showEnd; },
      set(v) { this.$store.commit('setShowEnd', v); },
    },
    showInterrupt: {
      get() { return this.$store.getters.showInterrupt; },
      set(v) { this.$store.commit('setShowInterrupt', v); },
    },
    showDispose: {
      get() { return this.$store.getters.showDispose; },
      set(v) { this.$store.commit('setShowDispose', v); },
    },
    ...mapGetters([
      'hasSpineData',
    ]),
  },
};
</script>

<style scoped>

</style>
