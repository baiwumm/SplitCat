<!--
 * @Author: baiwumm me@baiwumm.com
 * @Date: 2025-08-04 21:42:01
 * @LastEditors: 白雾茫茫丶<baiwumm.com>
 * @FilePath: \SplitCat\src\components\AppHeader.vue
 * @Description: 应用头部组件 - 现代化简洁版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<template>
  <header class="py-4 mb-0.5">
    <div class="max-w-[var(--container-width)] mx-auto flex items-center justify-between px-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200/30">
          <Icon icon="mdi:cat" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-white m-0 leading-tight">分账猫</h1>
          <p class="text-sm text-white/80 m-0">轻松分账，快乐聚餐</p>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex gap-4">
          <div class="flex items-center gap-2 bg-white/15 backdrop-blur-sm py-2 px-3 rounded-full text-sm text-white">
            <NIcon>
              <Icon icon="mdi:account-group" />
            </NIcon>
            <span>{{ splitStore.participants.length }} 人</span>
          </div>
          <div class="flex items-center gap-2 bg-white/15 backdrop-blur-sm py-2 px-3 rounded-full text-sm text-white">
            <NIcon>
              <Icon icon="mdi:cash-multiple" />
            </NIcon>
            <span>¥{{ splitStore.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="flex items-center gap-2 bg-white/15 backdrop-blur-sm py-2 px-3 rounded-full text-sm text-white">
            <NIcon>
              <Icon icon="mdi:receipt" />
            </NIcon>
            <span>{{ splitStore.expenses.length }} 项</span>
          </div>
        </div>

        <NButton @click="handleNewSession" type="primary" round size="medium">
          <template #icon>
            <NIcon>
              <Icon icon="mdi:plus" />
            </NIcon>
          </template>
          新建分账
        </NButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { NButton, NIcon, useDialog,useMessage } from "naive-ui";

import { useSplitStore } from "@/stores/splitStore";

const splitStore = useSplitStore();
const dialog = useDialog();
const message = useMessage();

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
    // 当没有数据时，显示提示信息
    message.info("当前已是新的分账会话，请添加参与者和消费项目");
  }
};
</script>

<style scoped>
/* 移动端响应式样式 */
@media (max-width: 768px) {
  header > div {
    flex-direction: column;
    gap: 1rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  
  header > div > div:last-child {
    width: 100%;
    justify-content: space-between;
  }
  
  header > div > div:last-child > div:first-child {
    gap: 0.5rem;
  }
  
  header > div > div:last-child > div:first-child > div {
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
