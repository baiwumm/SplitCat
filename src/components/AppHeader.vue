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
  <header class="app-header">
    <div class="header-content">
      <div class="logo-section">
        <div class="logo-container">
          <Icon icon="mdi:cat" />
        </div>
        <div class="app-title">
          <h1>分账猫</h1>
          <p>轻松分账，快乐聚餐</p>
        </div>
      </div>

      <div class="actions-section">
        <div class="stats-pills">
          <div class="stat-pill">
            <NIcon>
              <Icon icon="mdi:account-group" />
            </NIcon>
            <span>{{ splitStore.participants.length }} 人</span>
          </div>
          <div class="stat-pill">
            <NIcon>
              <Icon icon="mdi:cash-multiple" />
            </NIcon>
            <span>¥{{ splitStore.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="stat-pill">
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
.app-header {
  padding: 1rem 0;
  margin-bottom: 0.5rem;
}

.header-content {
  max-width: var(--container-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-container {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-lg);
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.app-title h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
}

.app-title p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.actions-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stats-pills {
  display: flex;
  gap: 1rem;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  padding: 0.5rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  color: white;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
  }
  
  .actions-section {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-pills {
    gap: 0.5rem;
  }
  
  .stat-pill {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
