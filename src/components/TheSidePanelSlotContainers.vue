<template>
  <el-collapse-item name="slot-containers">
    <template #title>
      <i class="el-icon-coffee" />
      <b style="margin-left: 10px" class="panel-group-title">Slot Containers</b>
    </template>
    <el-button
      size="mini"
      type="danger"
      @click="$_clearSlot()"
      style="margin-left: 8px;"
    >
      Clear
    </el-button>
    <el-form size="mini" label-width="120px" class="slot-form">
      <el-form-item label="Available slots" >
        <el-select
          v-model="selectedSlot"
          placeholder="Select a slot"
          @change="$_handleSlotsSelect"
          filterable
          clearable
          style="width: 100%;"
        >
          <el-option
            v-for="slot in filteredAvailableSlots"
            :key="slot"
            :label="slot"
            :value="slot"
          />
        </el-select>
      </el-form-item>

      <div
        class="slot-item"
        v-for="item in attachedItems"
        :key="item.name"
      >
        <el-form-item :label="`Slot: ${item.name}`"></el-form-item>
      </div>
    </el-form>
  </el-collapse-item>
</template>

<script>
import { mapGetters } from 'vuex';
import { SpineSprite } from '@pixi-spine/all-4.1';
import * as PIXI from 'pixi.js';

export default {
  name: 'TheSidePanelSlotContainers',
  data() {
    return {
      slotSearch: '',
      selectedSlot: null,
      attachedItems: [],
    };
  },
  computed: {
    ...mapGetters(['slotContainer']),

    availableSlots() {
      return this.slotContainer.map((item) => item.name);
    },

    filteredAvailableSlots() {
      const search = this.slotSearch.toLowerCase();
      return this.availableSlots.filter((name) => name.toLowerCase().includes(search));
    },
  },

  methods: {
    $_clearSlot() {
      this.slotContainer.forEach((slott) => {
        slott.children.forEach((child) => {
          if (child instanceof SpineSprite && child?.name) {
            child.removeChildren();
          }
        });
      });
      this.attachedItems = [];
    },
    $_handleSlotsSelect(slotName) {
      if (!slotName) return;
      let rezult = null;
      this.slotContainer
        .forEach((slott) => {
          slott.children.forEach((child) => {
            if (child instanceof SpineSprite) {
              if (child?.name === slotName) {
                rezult = child;
              }
            }
          });
        });
      const bunny = PIXI.Sprite.from('https://pixijs.com/assets/bunny.png');
      bunny.anchor.set(0.5, 0.5);
      if (rezult) {
        rezult.addChild(bunny);
      }

      const alreadyExists = this.attachedItems.some(
        (item) => item.name === slotName,
      );

      if (!alreadyExists) {
        this.attachedItems.push({
          name: slotName,
          type: 'image',
          img: null,
          imgName: null,
        });
      }
      this.selectedSlot = null;
    },
  },
};
</script>

<style scoped>
.slot-form {
  padding: 10px;
}

.slot-item {
  margin-bottom: 12px;
  border: 1px dashed #dcdfe6;
  padding: 10px;
  border-radius: 6px;
  background-color: #fafafa;
}

</style>
