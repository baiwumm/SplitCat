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
  NMenu,
  NIcon,
  zhCN,
  dateZhCN,
  NButton,
  NSpace,
} from "naive-ui";
import { ref, h, computed } from "vue";

import AppHeader from "./components/AppHeader.vue";
import ExpenseManager from "./components/ExpenseManager.vue";
import ParticipantManager from "./components/ParticipantManager.vue";
import SplitResults from "./components/SplitResults.vue";
import { useSplitStore } from "./stores/splitStore";

const currentTab = ref<"participants" | "expenses" | "results">("participants");
const collapsed = ref(false);
const splitStore = useSplitStore();

// 切换标签的方法
const switchTab = (tab: "participants" | "expenses" | "results") => {
  currentTab.value = tab;
};

// 菜单图标渲染函数
function renderIcon(icon: string) {
  return () => h(NIcon, null, { default: () => h(Icon, { icon }) });
}

// 计算菜单徽章
const getMenuBadge = (key: string) => {
  switch (key) {
    case "participants":
      return splitStore.participants.length > 0 ? splitStore.participants.length : null;
    case "expenses":
      return splitStore.expenses.length > 0 ? splitStore.expenses.length : null;
    case "results":
      return splitStore.participants.length > 0 && splitStore.expenses.length > 0 ? "✓" : null;
    default:
      return null;
  }
};

// 菜单选项
const menuOptions = computed(() => [
  {
    label: "参与人员",
    key: "participants",
    icon: renderIcon("mdi:account-group"),
    badge: getMenuBadge("participants"),
  },
  {
    label: "消费录入",
    key: "expenses",
    icon: renderIcon("mdi:cash-multiple"),
    badge: getMenuBadge("expenses"),
  },
  {
    label: "分账结果",
    key: "results",
    icon: renderIcon("mdi:chart-pie"),
    badge: getMenuBadge("results"),
  },
]);

// 当前页面标题
const currentPageTitle = computed(() => {
  const titles = {
    participants: "参与人员管理",
    expenses: "消费录入",
    results: "分账结果",
  };
  return titles[currentTab.value];
});

// 当前页面图标
const currentPageIcon = computed(() => {
  const icons = {
    participants: "mdi:account-group",
    expenses: "mdi:cash-multiple",
    results: "mdi:chart-pie",
  };
  return icons[currentTab.value];
});
</script>

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN">
    <NDialogProvider>
      <NMessageProvider>
        <div class="app-container">
          <!-- 顶部导航栏 -->
          <AppHeader />

          <div class="main-container">
            <!-- 侧边导航 -->
            <aside class="sidebar" :class="{ 'sidebar-collapsed': collapsed }">
              <div class="sidebar-header">
                <div class="sidebar-toggle" @click="collapsed = !collapsed">
                  <NIcon size="18">
                    <Icon :icon="collapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'" />
                  </NIcon>
                </div>
              </div>

              <div class="sidebar-content">
                <NMenu
                  :collapsed="collapsed"
                  :collapsed-width="64"
                  :collapsed-icon-size="22"
                  :options="menuOptions"
                  :value="currentTab"
                  @update:value="currentTab = $event"
                  :indent="18"
                  class="custom-menu"
                />
              </div>

              <!-- 底部统计信息 -->
              <div v-if="!collapsed" class="sidebar-footer">
                <div class="stats-card">
                  <div class="stat-item">
                    <NIcon size="16" class="stat-icon">
                      <Icon icon="mdi:account-group" />
                    </NIcon>
                    <span class="stat-label">参与人数</span>
                    <span class="stat-value">{{ splitStore.participants.length }}</span>
                  </div>
                  <div class="stat-item">
                    <NIcon size="16" class="stat-icon">
                      <Icon icon="mdi:cash-multiple" />
                    </NIcon>
                    <span class="stat-label">消费项目</span>
                    <span class="stat-value">{{ splitStore.expenses.length }}</span>
                  </div>
                  <div class="stat-item">
                    <NIcon size="16" class="stat-icon">
                      <Icon icon="mdi:currency-cny" />
                    </NIcon>
                    <span class="stat-label">总金额</span>
                    <span class="stat-value">¥{{ splitStore.totalAmount.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </aside>

            <!-- 主内容区域 -->
            <main class="content">
              <!-- 页面标题栏 -->
              <div class="page-header">
                <div class="page-title">
                  <NIcon size="28" class="page-icon">
                    <Icon :icon="currentPageIcon" />
                  </NIcon>
                  <h1>{{ currentPageTitle }}</h1>
                </div>
                <div class="page-actions">
                  <NSpace>
                    <NButton
                      v-if="
                        currentTab === 'results' && splitStore.participants.length > 0 && splitStore.expenses.length > 0
                      "
                      type="primary"
                      ghost
                      @click="splitStore.exportResults"
                    >
                      <template #icon>
                        <NIcon>
                          <Icon icon="mdi:download" />
                        </NIcon>
                      </template>
                      导出结果
                    </NButton>
                    <NButton v-if="currentTab === 'results'" type="warning" ghost @click="splitStore.clearAll">
                      <template #icon>
                        <NIcon>
                          <Icon icon="mdi:refresh" />
                        </NIcon>
                      </template>
                      清空数据
                    </NButton>
                  </NSpace>
                </div>
              </div>

              <!-- 页面内容 -->
              <div class="page-content">
                <keep-alive>
                  <component
                    :is="
                      currentTab === 'participants'
                        ? ParticipantManager
                        : currentTab === 'expenses'
                        ? ExpenseManager
                        : SplitResults
                    "
                    @update:currentTab="switchTab"
                  />
                </keep-alive>
              </div>
            </main>
          </div>
        </div>
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--n-text-color);
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  margin: 16px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.sidebar {
  position: relative;
  width: 280px;
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px 0 0 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  margin-left: auto;
}

.sidebar-toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.sidebar-content {
  flex: 1;
  padding: 16px 8px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.stats-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  padding: 16px;
  color: white;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-icon {
  opacity: 0.8;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.stat-value {
  font-weight: 600;
  font-size: 14px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-radius: 0 16px 16px 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-icon {
  color: #667eea;
}

.page-title h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.page-actions {
  display: flex;
  align-items: center;
}

.page-content {
  flex: 1;
  padding: 24px 32px;
  overflow: auto;
}

.custom-menu :deep(.n-menu-item) {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.custom-menu :deep(.n-menu-item-content) {
  padding: 12px 16px;
  font-weight: 500;
}

.custom-menu :deep(.n-menu-item-content--selected) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.custom-menu :deep(.n-menu-item-content:hover) {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    margin: 8px;
    border-radius: 12px;
  }

  .sidebar {
    width: 240px;
  }

  .sidebar-collapsed {
    width: 64px;
  }

  .page-header {
    padding: 16px 20px 12px;
  }

  .page-content {
    padding: 16px 20px;
  }

  .page-title h1 {
    font-size: 20px;
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
