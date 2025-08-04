<!--
 * @Author: baiwumm me@baiwumm.com
 * @FilePath: \SplitCat\src\components\ParticipantManager.vue
 * @Description: 参与人员管理组件 - 现代化重构版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  NCard,
  NInput,
  NButton,
  NIcon,
  NText,
  NTag,
  NDataTable,
  NSpace,
  NPopconfirm,
  NEmpty,
  NAvatar,
  NDivider,
  NInputGroup,
  NInputGroupLabel,
  useMessage,
} from "naive-ui";
import { ref, computed, h } from "vue";

import { useSplitStore } from "../stores/splitStore";

const splitStore = useSplitStore();
const message = useMessage();
const newParticipantName = ref("");
const searchKeyword = ref("");

// 常用联系人
const commonContacts = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"];

// 表格列配置
const columns = [
  {
    title: "头像",
    key: "avatar",
    width: 60,
    render: (row: any) => {
      return h(
        NAvatar,
        {
          round: true,
          size: "medium",
          color: getAvatarColor(row.name),
        },
        {
          default: () => row.name.charAt(0),
        }
      );
    },
  },
  {
    title: "姓名",
    key: "name",
    render: (row: any) => {
      return h("div", { class: "participant-name" }, [
        h("span", { class: "name-text" }, row.name),
        h("span", { class: "name-id" }, `#${row.id.slice(-4)}`),
      ]);
    },
  },
  {
    title: "参与项目",
    key: "expenseCount",
    width: 120,
    render: (row: any) => {
      const count = splitStore.expenses.filter((expense) => expense.participants.includes(row.id)).length;
      return h(
        NTag,
        {
          type: count > 0 ? "success" : "default",
          size: "small",
          round: true,
        },
        { default: () => `${count} 项` }
      );
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    render: (row: any) => {
      return h(
        NSpace,
        { size: "small" },
        {
          default: () => [
            h(
              NButton,
              {
                size: "small",
                type: "error",
                ghost: true,
                onClick: () => removeParticipant(row.id),
              },
              {
                default: () => "删除",
                icon: () => h(NIcon, null, { default: () => h(Icon, { icon: "mdi:delete-outline" }) }),
              }
            ),
          ],
        }
      );
    },
  },
];

// 过滤后的参与者列表
const filteredParticipants = computed(() => {
  if (!searchKeyword.value) return splitStore.participants;
  return splitStore.participants.filter((p) => p.name.toLowerCase().includes(searchKeyword.value.toLowerCase()));
});

// 获取头像颜色
const getAvatarColor = (name: string) => {
  const colors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#38f9d7",
    "#fa709a",
    "#fee140",
    "#a8edea",
    "#fed6e3",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// 添加参与者
const addParticipant = () => {
  const name = newParticipantName.value.trim();
  if (!name) {
    message.warning("请输入参与者姓名");
    return;
  }

  if (splitStore.participants.some((p) => p.name === name)) {
    message.error("该参与者已存在");
    return;
  }

  splitStore.addParticipant(name);
  newParticipantName.value = "";
  message.success("参与者添加成功");
};

// 快速添加参与者
const quickAddParticipant = (name: string) => {
  if (splitStore.participants.some((p) => p.name === name)) {
    message.warning("该参与者已存在");
    return;
  }
  splitStore.addParticipant(name);
  message.success(`已添加 ${name}`);
};

// 删除参与者
const removeParticipant = (id: string) => {
  const participant = splitStore.participants.find((p) => p.id === id);
  if (!participant) return;

  const expenseCount = splitStore.expenses.filter((expense) => expense.participants.includes(id)).length;

  if (expenseCount > 0) {
    message.warning(`该参与者参与了 ${expenseCount} 个消费项目，删除后相关数据将被清除`);
  }

  splitStore.removeParticipant(id);
  message.success("参与者删除成功");
};

// 清空所有参与者
const clearAllParticipants = () => {
  if (splitStore.participants.length === 0) {
    message.warning("没有参与者可清空");
    return;
  }

  splitStore.participants = [];
  message.success("已清空所有参与者");
};
</script>

<template>
  <div class="participant-manager">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <NCard class="stat-card" :bordered="false">
        <div class="stat-content">
          <NIcon size="32" class="stat-icon">
            <Icon icon="mdi:account-group" />
          </NIcon>
          <div class="stat-info">
            <div class="stat-value">{{ splitStore.participants.length }}</div>
            <div class="stat-label">参与人数</div>
          </div>
        </div>
      </NCard>

      <NCard class="stat-card" :bordered="false">
        <div class="stat-content">
          <NIcon size="32" class="stat-icon">
            <Icon icon="mdi:cash-multiple" />
          </NIcon>
          <div class="stat-info">
            <div class="stat-value">{{ splitStore.expenses.length }}</div>
            <div class="stat-label">消费项目</div>
          </div>
        </div>
      </NCard>

      <NCard class="stat-card" :bordered="false">
        <div class="stat-content">
          <NIcon size="32" class="stat-icon">
            <Icon icon="mdi:currency-cny" />
          </NIcon>
          <div class="stat-info">
            <div class="stat-value">¥{{ splitStore.totalAmount.toFixed(2) }}</div>
            <div class="stat-label">总金额</div>
          </div>
        </div>
      </NCard>
    </div>

    <div class="content-grid">
      <!-- 左侧：添加参与者 -->
      <div class="left-panel">
        <NCard class="feature-card" :bordered="false">
          <template #header>
            <div class="card-header">
              <NIcon size="20" class="card-icon">
                <Icon icon="mdi:account-plus-outline" />
              </NIcon>
              <span>添加新参与者</span>
            </div>
          </template>

          <div class="input-section">
            <NInputGroup>
              <NInputGroupLabel>姓名</NInputGroupLabel>
              <NInput v-model:value="newParticipantName" placeholder="输入参与者姓名" @keyup.enter="addParticipant" round
                class="name-input" />
            </NInputGroup>

            <NButton @click="addParticipant" type="primary" :disabled="!newParticipantName.trim()" round
              class="add-button">
              <template #icon>
                <NIcon>
                  <Icon icon="mdi:plus" />
                </NIcon>
              </template>
              添加参与者
            </NButton>
          </div>

          <!-- 快速添加常用联系人 -->
          <NDivider title-placement="left">
            <NIcon size="16">
              <Icon icon="mdi:lightning-bolt" />
            </NIcon>
            <span class="divider-text">快速添加</span>
          </NDivider>

          <div class="quick-contacts">
            <NTag v-for="contact in commonContacts" :key="contact" @click="quickAddParticipant(contact)"
              class="contact-chip" :bordered="false" round size="medium" type="info"
              :disabled="splitStore.participants.some((p) => p.name === contact)">
              <template #icon>
                <NIcon>
                  <Icon icon="mdi:account" />
                </NIcon>
              </template>
              {{ contact }}
            </NTag>
          </div>
        </NCard>
      </div>

      <!-- 右侧：参与者列表 -->
      <div class="right-panel">
        <NCard class="feature-card" :bordered="false">
          <template #header>
            <div class="card-header">
              <NIcon size="20" class="card-icon">
                <Icon icon="mdi:format-list-bulleted" />
              </NIcon>
              <span>参与者列表</span>
              <NTag v-if="splitStore.participants.length > 0" class="count-tag" type="success" size="small" round>
                {{ splitStore.participants.length }}人
              </NTag>
            </div>
          </template>

          <!-- 搜索栏 -->
          <div v-if="splitStore.participants.length > 0" class="search-section">
            <NInput v-model:value="searchKeyword" placeholder="搜索参与者..." round class="search-input">
              <template #prefix>
                <NIcon>
                  <Icon icon="mdi:magnify" />
                </NIcon>
              </template>
            </NInput>
          </div>

          <!-- 空状态 -->
          <div v-if="splitStore.participants.length === 0" class="empty-state">
            <NEmpty description="还没有添加参与者">
              <template #icon>
                <NIcon size="64" class="empty-icon">
                  <Icon icon="mdi:account-group-outline" />
                </NIcon>
              </template>
              <template #extra>
                <NText depth="3" class="empty-desc"> 请先添加参与分账的朋友 </NText>
              </template>
            </NEmpty>
          </div>

          <!-- 参与者表格 -->
          <div v-else-if="filteredParticipants.length === 0" class="empty-state">
            <NEmpty description="没有找到匹配的参与者">
              <template #icon>
                <NIcon size="64" class="empty-icon">
                  <Icon icon="mdi:magnify" />
                </NIcon>
              </template>
            </NEmpty>
          </div>

          <div v-else class="participant-table">
            <NDataTable :columns="columns" :data="filteredParticipants" :pagination="{ pageSize: 8 }" :bordered="false"
              :single-line="false" class="custom-table" />
          </div>

          <!-- 操作按钮 -->
          <div v-if="splitStore.participants.length > 0" class="action-buttons">
            <NPopconfirm @positive-click="clearAllParticipants">
              <template #trigger>
                <NButton type="warning" ghost size="small">
                  <template #icon>
                    <NIcon>
                      <Icon icon="mdi:delete-sweep" />
                    </NIcon>
                  </template>
                  清空所有
                </NButton>
              </template>
              确定要清空所有参与者吗？
            </NPopconfirm>
          </div>
        </NCard>
      </div>
    </div>

    <!-- 操作提示 -->
    <NCard v-if="splitStore.participants.length > 0" class="tip-card" :bordered="false">
      <div class="tip-content">
        <NIcon size="24" class="tip-icon">
          <Icon icon="mdi:lightbulb-outline" />
        </NIcon>
        <div class="tip-text">
          <p class="tip-title">下一步</p>
          <p class="tip-desc">添加完参与者后，点击左侧"消费录入"开始记录消费项目</p>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.participant-manager {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  opacity: 0.9;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
}

.feature-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.feature-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1a202c;
}

.card-icon {
  color: #667eea;
}

.count-tag {
  margin-left: auto;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.name-input {
  flex: 1;
}

.add-button {
  height: 40px;
  font-weight: 500;
}

.divider-text {
  margin-left: 8px;
  font-size: 14px;
  color: #64748b;
}

.quick-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.contact-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.contact-chip:hover:not(:disabled) {
  transform: scale(1.05);
}

.contact-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-section {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  color: #cbd5e1;
}

.empty-desc {
  margin-top: 8px;
}

.participant-table {
  margin-bottom: 16px;
}

.custom-table :deep(.n-data-table) {
  border-radius: 8px;
}

.custom-table :deep(.n-data-table-th) {
  background: #f8fafc;
  font-weight: 600;
}

.custom-table :deep(.n-data-table-td) {
  padding: 12px 16px;
}

.participant-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-text {
  font-weight: 500;
  color: #1a202c;
}

.name-id {
  font-size: 12px;
  color: #64748b;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.tip-card {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
}

.tip-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tip-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-weight: 600;
  color: #92400e;
  margin: 0 0 4px 0;
}

.tip-desc {
  color: #92400e;
  margin: 0;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-contacts {
    justify-content: center;
  }

  .action-buttons {
    justify-content: center;
  }
}

/* 动画效果 */
.feature-card {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
