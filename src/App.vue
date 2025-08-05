<!--
 * @Author: baiwumm me@baiwumm.com
 * @Date: 2025-08-04 20:59:33
 * @LastEditors: 白雾茫茫丶<baiwumm.com>
 * @FilePath: \SplitCat\src\App.vue
 * @Description: 分账猫主应用 - 现代化重构版
 * 
 * Copyright (c) 2025 by baiwumm, All Rights Reserved. 
-->
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NIcon,
  zhCN,
  dateZhCN,
  NButton,
  NSpace,
  NTabs,
  NTabPane,
  NCard
} from "naive-ui";
import { ref } from "vue";

import AppHeader from "./components/AppHeader.vue";
import ExpenseManager from "./components/ExpenseManager.vue";
import ParticipantManager from "./components/ParticipantManager.vue";
import SplitResults from "./components/SplitResults.vue";
import { useSplitStore } from "./stores/splitStore";

const currentTab = ref<"participants" | "expenses" | "results">("participants");
const splitStore = useSplitStore();

// 切换标签的方法
const switchTab = (tab: "participants" | "expenses" | "results") => {
  currentTab.value = tab;
};
</script>

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN">
    <NDialogProvider>
      <NMessageProvider>
        <!-- 顶部导航栏 -->
        <AppHeader />
        <div class="flex justify-center">
          <div class="container">
            <NCard>
              <!-- 标签页导航 -->
              <NTabs v-model:value="currentTab" type="segment" animated size="large" class="main-tabs">
                <NTabPane name="participants">
                  <template #tab>
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon icon="mdi:account-group" class="text-lg text-purple-600 flex-shrink-0" />
                      <span class="font-medium text-sm truncate">参数人员</span>
                    </div>
                  </template>
                </NTabPane>
                <NTabPane name="expenses">
                  <template #tab>
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon icon="mdi:cash-multiple" class="text-lg text-yellow-600 flex-shrink-0" />
                      <span class="font-medium text-sm truncate">消费录入</span>
                    </div>
                  </template>
                </NTabPane>
                <NTabPane name="results">
                  <template #tab>
                    <div class="flex items-center gap-2 min-w-0">
                      <Icon icon="mdi:chart-pie" class="text-lg text-green-600 flex-shrink-0" />
                      <span class="font-medium text-sm truncate">分账结果</span>
                    </div>
                  </template>
                </NTabPane>
              </NTabs>

              <NSpace>
                <NButton v-if="
                  currentTab === 'results' && splitStore.participants.length > 0 && splitStore.expenses.length > 0
                " type="primary" @click="splitStore.exportResults" size="medium" round>
                  <template #icon>
                    <NIcon>
                      <Icon icon="mdi:download" />
                    </NIcon>
                  </template>
                  导出结果
                </NButton>
                <NButton v-if="currentTab === 'results'" type="warning" @click="splitStore.clearAll" size="medium"
                  round>
                  <template #icon>
                    <NIcon>
                      <Icon icon="mdi:refresh" />
                    </NIcon>
                  </template>
                  清空数据
                </NButton>
              </NSpace>

              <!-- 页面内容 -->
              <keep-alive>
                <component :is="currentTab === 'participants'
                  ? ParticipantManager
                  : currentTab === 'expenses'
                    ? ExpenseManager
                    : SplitResults
                  " @update:currentTab="switchTab" />
              </keep-alive>
            </NCard>
          </div>
        </div>
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>