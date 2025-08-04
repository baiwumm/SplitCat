<!--
 * @Author: baiwumm me@baiwumm.com
 * @Date: 2025-08-04 21:42:01
 * @LastEditors: 白雾茫茫丶<baiwumm.com>
 * @FilePath: \SplitCat\src\components\AppHeader.vue
 * @Description: 应用头部组件 - PC版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<template>
  <div class="header-container">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="logo-icon">
          <Icon icon="mdi:cat" class="text-3xl" />
        </div>
        <div>
          <h1 class="text-xl font-bold">分账猫</h1>
          <p class="text-sm opacity-80">轻松分账，快乐聚餐</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- 统计信息 -->
        <div class="flex gap-6 text-sm">
          <div class="flex items-center gap-2">
            <NIcon>
              <Icon icon="mdi:account-group" />
            </NIcon>
            <span>{{ splitStore.participants.length }} 人</span>
          </div>
          <div class="flex items-center gap-2">
            <NIcon>
              <Icon icon="mdi:cash-multiple" />
            </NIcon>
            <span>总计 ¥{{ splitStore.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <NIcon>
              <Icon icon="mdi:note-text" />
            </NIcon>
            <span>{{ splitStore.expenses.length }} 项</span>
          </div>
        </div>

        <NButton @click="handleNewSession" type="primary">
          <template #icon>
            <NIcon>
              <Icon icon="mdi:plus" />
            </NIcon>
          </template>
          新建分账
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { NButton, NIcon, useDialog } from "naive-ui";

import { useSplitStore } from "@/stores/splitStore";

const splitStore = useSplitStore();
const dialog = useDialog();

const handleNewSession = () => {
  if (splitStore.participants.length > 0 || splitStore.expenses.length > 0) {
    dialog.warning({
      title: "确认新建",
      content: "新建分账会清空当前所有数据，确定要继续吗？",
      positiveText: "确定",
      negativeText: "取消",
      onPositiveClick: () => {
        splitStore.startNewSession();
      },
    });
  } else {
    splitStore.startNewSession();
  }
};
</script>

<style scoped>
.header-container {
  padding: 16px 24px;
  background: linear-gradient(135deg, #1a6cff 0%, #6a11cb 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
</style>
