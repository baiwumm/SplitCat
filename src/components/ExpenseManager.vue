<!--
 * @Author: baiwumm me@baiwumm.com
 * @FilePath: \SplitCat\src\components\ExpenseManager.vue
 * @Description: 消费录入组件 - 现代化简洁版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  NInput,
  NInputNumber,
  NButton,
  NModal,
  NIcon,
  NDataTable,
  NTag,
  NPopconfirm,
  NEmpty,
  NText,
  NCard,
  useMessage,
} from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { h, ref, reactive, computed } from "vue";

import { useSplitStore, type ExpenseItem, type Participant } from "@/stores/splitStore";

const splitStore = useSplitStore();
const message = useMessage();

// 新增消费项目
const newExpense = reactive({
  name: "",
  amount: 0,
});

const selectedParticipants = ref<string[]>([]);

// 编辑相关
const showEditModal = ref(false);
const editingExpense = reactive({
  id: "",
  name: "",
  amount: 0,
  participants: [] as string[],
});

// 表格列定义
const columns = computed<DataTableColumns<ExpenseItem>>(() => [
  {
    title: "消费项目",
    key: "name",
    render(row) {
      return h("div", { class: "expense-item-name" }, row.name);
    },
  },
  {
    title: "金额",
    key: "amount",
    render(row) {
      return h("div", { class: "expense-item-amount" }, `¥${row.amount.toFixed(2)}`);
    },
  },
  {
    title: "参与人员",
    key: "participants",
    render(row) {
      return h("div", { class: "expense-item-participants" },
        h("div", { class: "participants-list" }, getParticipantNames(row.participants).join("、"))
      );
    },
  },
  {
    title: "人均",
    key: "average",
    render(row) {
      return h("div", { class: "expense-item-average" }, `¥${(row.amount / row.participants.length).toFixed(2)}`);
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    render(row) {
      return h("div", { class: "expense-item-actions" }, [
        h(
          NButton,
          {
            size: "small",
            quaternary: true,
            class: "action-button",
            onClick: () => editExpense(row),
          },
          {
            default: () => [
              h(NIcon, null, { default: () => h(Icon, { icon: "mdi:pencil" }) }),
              "编辑"
            ]
          }
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => removeExpense(row.id),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  quaternary: true,
                  class: "action-button",
                },
                {
                  default: () => [
                    h(NIcon, null, { default: () => h(Icon, { icon: "mdi:delete" }) }),
                    "删除"
                  ]
                }
              ),
            default: () => "确定要删除此消费项目吗？",
          }
        ),
      ]);
    },
  },
]);

// 选择/取消选择参与者
const toggleParticipant = (id: string) => {
  const index = selectedParticipants.value.indexOf(id);
  if (index === -1) {
    selectedParticipants.value.push(id);
  } else {
    selectedParticipants.value.splice(index, 1);
  }
};

// 编辑模式下选择/取消选择参与者
const toggleEditParticipant = (id: string) => {
  const index = editingExpense.participants.indexOf(id);
  if (index === -1) {
    editingExpense.participants.push(id);
  } else {
    editingExpense.participants.splice(index, 1);
  }
};

const selectAllParticipants = () => {
  selectedParticipants.value = splitStore.participants.map((p: Participant) => p.id);
};

const clearParticipants = () => {
  selectedParticipants.value = [];
};

const addExpense = () => {
  if (!newExpense.name.trim()) {
    message.warning("请输入消费项目名称");
    return;
  }

  if (!newExpense.amount || newExpense.amount <= 0) {
    message.warning("请输入有效的金额");
    return;
  }

  if (selectedParticipants.value.length === 0) {
    message.warning("请选择参与此项消费的人员");
    return;
  }

  splitStore.addExpense(newExpense.name, newExpense.amount, selectedParticipants.value);

  // 重置表单
  newExpense.name = "";
  newExpense.amount = 0;
  selectedParticipants.value = [];

  message.success("消费项目添加成功");
};

const editExpense = (expense: ExpenseItem) => {
  editingExpense.id = expense.id;
  editingExpense.name = expense.name;
  editingExpense.amount = expense.amount;
  editingExpense.participants = [...expense.participants];
  showEditModal.value = true;
};

const saveExpense = () => {
  if (!editingExpense.name.trim()) {
    message.warning("请输入消费项目名称");
    return;
  }

  if (!editingExpense.amount || editingExpense.amount <= 0) {
    message.warning("请输入有效的金额");
    return;
  }

  if (editingExpense.participants.length === 0) {
    message.warning("请选择参与此项消费的人员");
    return;
  }

  splitStore.updateExpense(editingExpense.id, {
    name: editingExpense.name,
    amount: editingExpense.amount,
    participants: editingExpense.participants,
  });

  showEditModal.value = false;
  message.success("消费项目更新成功");
};

const removeExpense = (id: string) => {
  const expense = splitStore.expenses.find((e) => e.id === id);
  if (expense) {
    splitStore.removeExpense(id);
    message.success(`已删除 ${expense.name}`);
  }
};

const getParticipantNames = (participantIds: string[]) => {
  return participantIds.map((id) => {
    const participant = splitStore.participants.find((p) => p.id === id);
    return participant?.name || "未知";
  });
};
</script>

<template>
  <div class="expense-manager">
    <div class="expense-container">
      <!-- 左侧：添加消费项目 -->
      <div class="expense-form-container">
        <NCard class="expense-card">
          <template #header>
            <div class="card-header">
              <NIcon size="20" class="card-icon">
                <Icon icon="mdi:plus-circle" />
              </NIcon>
              <span>添加消费项目</span>
            </div>
          </template>

          <div class="expense-form">
            <div class="form-group">
              <NInput v-model:value="newExpense.name" placeholder="消费项目名称" class="expense-input" round>
                <template #prefix>
                  <NIcon>
                    <Icon icon="mdi:tag-outline" />
                  </NIcon>
                </template>
              </NInput>
            </div>

            <div class="form-group">
              <NInputNumber v-model:value="newExpense.amount" placeholder="消费金额" :precision="2" :min="0"
                class="expense-input" round>
                <template #prefix>¥</template>
              </NInputNumber>
            </div>

            <!-- 参与者选择 -->
            <div class="form-group">
              <div class="group-header">
                <span class="group-label">参与人员</span>
                <div class="group-actions">
                  <NButton @click="selectAllParticipants" size="tiny" text>全选</NButton>
                  <NButton @click="clearParticipants" size="tiny" text>清空</NButton>
                </div>
              </div>
              
              <div v-if="splitStore.participants.length === 0" class="empty-participants">
                <NIcon size="18">
                  <Icon icon="mdi:account-alert" />
                </NIcon>
                <span>请先添加参与者</span>
              </div>
              <div v-else class="participants-selector">
                <div class="participants-tags">
                  <NTag v-for="participant in splitStore.participants" :key="participant.id"
                    :type="selectedParticipants.includes(participant.id) ? 'primary' : 'default'" 
                    :bordered="false"
                    round 
                    size="small" 
                    class="participant-tag" 
                    @click="toggleParticipant(participant.id)">
                    {{ participant.name }}
                  </NTag>
                </div>
              </div>
            </div>

            <NButton @click="addExpense" type="primary" block round
              :disabled="!newExpense.name.trim() || !newExpense.amount || selectedParticipants.length === 0"
              class="submit-button">
              <template #icon>
                <NIcon>
                  <Icon icon="mdi:plus" />
                </NIcon>
              </template>
              添加消费项目
            </NButton>
          </div>
        </NCard>

        <!-- 总计信息 -->
        <NCard v-if="splitStore.expenses.length > 0" class="summary-card">
          <div class="summary-content">
            <div class="summary-main">
              <div class="summary-label">消费总计</div>
              <div class="summary-amount">¥{{ splitStore.totalAmount.toFixed(2) }}</div>
            </div>
            <div class="summary-details">
              <div class="summary-item">
                <NIcon size="16">
                  <Icon icon="mdi:receipt" />
                </NIcon>
                <span>{{ splitStore.expenses.length }} 项消费</span>
              </div>
              <div class="summary-item">
                <NIcon size="16">
                  <Icon icon="mdi:account-group" />
                </NIcon>
                <span>{{ splitStore.participants.length }} 人参与</span>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      <!-- 右侧：消费列表 -->
      <div class="expense-list-container">
        <NCard class="expense-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <NIcon size="20" class="card-icon">
                  <Icon icon="mdi:format-list-bulleted" />
                </NIcon>
                <span>消费列表</span>
                <NTag v-if="splitStore.expenses.length > 0" class="count-tag" type="success" size="small" round>
                  {{ splitStore.expenses.length }}项
                </NTag>
              </div>
            </div>
          </template>

          <!-- 无数据状态 -->
          <div v-if="splitStore.expenses.length === 0" class="empty-state">
            <NEmpty description="还没有添加消费项目">
              <template #icon>
                <NIcon size="64" class="empty-icon">
                  <Icon icon="mdi:receipt-text-outline" />
                </NIcon>
              </template>
              <template #extra>
                <NText depth="3" class="empty-desc">请在左侧添加消费项目</NText>
              </template>
            </NEmpty>
          </div>

          <!-- 消费列表 -->
          <div v-else class="expense-list">
            <div class="expense-table-container">
              <NDataTable 
                :columns="columns" 
                :data="splitStore.expenses" 
                :pagination="{ pageSize: 10 }"
                :bordered="false" 
                class="expense-table" 
              />
            </div>
          </div>
        </NCard>

        <!-- 操作提示 -->
        <NCard v-if="splitStore.expenses.length > 0" class="tip-card">
          <div class="tip-content">
            <NIcon size="24" class="tip-icon">
              <Icon icon="mdi:lightbulb-on" />
            </NIcon>
            <div class="tip-text">
              <p class="tip-title">小贴士</p>
              <p class="tip-desc">添加完消费项目后，可以切换到"分账结果"查看每个人应付的金额</p>
            </div>
          </div>
        </NCard>
      </div>
    </div>
  </div>

  <!-- 编辑弹窗 -->
  <NModal v-model:show="showEditModal" preset="card" class="edit-modal">
    <template #header>
      <div class="modal-header">
        <NIcon size="20">
          <Icon icon="mdi:pencil" />
        </NIcon>
        <span>编辑消费项目</span>
      </div>
    </template>

    <div class="modal-content">
      <div class="form-group">
        <NInput v-model:value="editingExpense.name" placeholder="消费项目名称" round />
      </div>

      <div class="form-group">
        <NInputNumber v-model:value="editingExpense.amount" placeholder="金额" :precision="2" :min="0" class="expense-input"
          round>
          <template #prefix>¥</template>
        </NInputNumber>
      </div>

      <div class="form-group">
        <div class="group-header">
          <span class="group-label">参与人员</span>
        </div>
        <div class="participants-tags edit-participants">
          <NTag v-for="participant in splitStore.participants" :key="participant.id"
            :type="editingExpense.participants.includes(participant.id) ? 'primary' : 'default'" :bordered="false" round
            size="small" class="participant-tag" @click="toggleEditParticipant(participant.id)">
            {{ participant.name }}
          </NTag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <NButton @click="showEditModal = false" round quaternary>取消</NButton>
        <NButton @click="saveExpense" type="primary" round>保存</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.expense-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.expense-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
}

.expense-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-icon {
  color: var(--primary-color);
}

.count-tag {
  margin-left: 0.5rem;
}

/* 表单样式 */
.expense-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.expense-input {
  width: 100%;
}

.empty-participants {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.participants-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.participants-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.participant-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.participant-tag:hover {
  transform: translateY(-2px);
}

.submit-button {
  margin-top: 0.5rem;
  height: 2.5rem;
  font-weight: 500;
}

/* 总计卡片 */
.summary-card {
  background: var(--primary-gradient);
  color: white;
  margin-top: 1rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-main {
  text-align: center;
}

.summary-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.summary-amount {
  font-size: 1.75rem;
  font-weight: 700;
}

.summary-details {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 0.75rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

/* 空状态 */
.empty-state {
  padding: 2rem 1rem;
  text-align: center;
}

.empty-icon {
  color: var(--text-tertiary);
}

.empty-desc {
  margin-top: 0.5rem;
}

/* 表格样式 */
.expense-table-container {
  overflow-x: auto;
}

.expense-table :deep(.n-data-table-th) {
  background-color: var(--bg-tertiary);
  font-weight: 600;
}

.expense-item-name {
  font-weight: 500;
  color: var(--text-primary);
}

.expense-item-amount {
  font-weight: 600;
  color: var(--danger-color);
}

.expense-item-participants {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.expense-item-average {
  font-size: 0.875rem;
  color: var(--primary-color);
  font-weight: 500;
}

.expense-item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* 提示卡片 */
.tip-card {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  margin-top: 1rem;
}

.tip-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.tip-icon {
  color: rgba(0, 0, 0, 0.6);
  margin-top: 0.125rem;
}

.tip-title {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 0.25rem;
}

.tip-desc {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.7);
}

/* 编辑弹窗 */
.edit-modal {
  width: 400px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.edit-participants {
  max-height: 120px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .expense-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>