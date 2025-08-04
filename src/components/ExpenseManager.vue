<!--
 * @Author: baiwumm me@baiwumm.com
 * @FilePath: \SplitCat\src\components\ExpenseManager.vue
 * @Description: 消费录入组件 - PC版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<template>
  <div class="expense-manager">
    <div class="expense-container">
      <!-- 左侧：添加消费项目 -->
      <div class="expense-form-container">
        <div class="expense-card">
          <div class="expense-card-header">
            <NIcon size="24" class="expense-card-icon">
              <Icon icon="mdi:plus-circle" />
            </NIcon>
            <span class="expense-card-title">添加消费项目</span>
          </div>

          <div class="expense-form">
            <div class="form-group">
              <label class="form-label">消费项目名称</label>
              <NInput v-model:value="newExpense.name" placeholder="如：火锅、KTV、打车等" class="expense-input" round>
                <template #prefix>
                  <NIcon>
                    <Icon icon="mdi:tag-outline" />
                  </NIcon>
                </template>
              </NInput>
            </div>

            <div class="form-group">
              <label class="form-label">消费金额</label>
              <NInputNumber v-model:value="newExpense.amount" placeholder="请输入金额" :precision="2" :min="0"
                class="expense-input" round>
                <template #prefix>¥</template>
              </NInputNumber>
            </div>

            <!-- 参与者选择 -->
            <div class="form-group">
              <label class="form-label">参与人员</label>
              <div v-if="splitStore.participants.length === 0" class="empty-participants">
                <NIcon size="20">
                  <Icon icon="mdi:account-alert" />
                </NIcon>
                <span>请先在"参与人员"页面添加参与者</span>
              </div>
              <div v-else class="participants-selector">
                <div class="participants-tags">
                  <NTag v-for="participant in splitStore.participants" :key="participant.id"
                    :type="selectedParticipants.includes(participant.id) ? 'primary' : 'default'" :bordered="false"
                    round size="medium" class="participant-tag" @click="toggleParticipant(participant.id)">
                    {{ participant.name }}
                  </NTag>
                </div>
                <div class="participants-actions">
                  <NButton @click="selectAllParticipants" size="small" quaternary>全选</NButton>
                  <NButton @click="clearParticipants" size="small" quaternary>清空</NButton>
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
        </div>

        <!-- 总计信息 -->
        <div v-if="splitStore.expenses.length > 0" class="expense-summary-card">
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
        </div>
      </div>

      <!-- 右侧：消费列表 -->
      <div class="expense-list-container">
        <div class="expense-card">
          <div class="expense-card-header">
            <NIcon size="24" class="expense-card-icon">
              <Icon icon="mdi:format-list-bulleted" />
            </NIcon>
            <span class="expense-card-title">消费列表</span>
          </div>

          <!-- 无数据状态 -->
          <div v-if="splitStore.expenses.length === 0" class="empty-state">
            <div class="empty-icon-container">
              <NIcon size="64" class="empty-icon">
                <Icon icon="mdi:receipt-text-outline" />
              </NIcon>
            </div>
            <p class="empty-title">还没有添加消费项目</p>
            <p class="empty-desc">请在左侧添加本次聚餐的消费明细</p>
          </div>

          <!-- 消费列表 -->
          <div v-else class="expense-list">
            <div class="expense-table-container">
              <NDataTable :columns="columns" :data="splitStore.expenses" :pagination="{ pageSize: 10 }"
                :bordered="false" class="expense-table" />
            </div>
          </div>
        </div>

        <!-- 操作提示 -->
        <div v-if="splitStore.expenses.length > 0" class="expense-tip-card">
          <div class="tip-content">
            <NIcon size="24" class="tip-icon">
              <Icon icon="mdi:lightbulb-on" />
            </NIcon>
            <div class="tip-text">
              <p class="tip-title">小贴士</p>
              <p class="tip-desc">添加完消费项目后，可以切换到"分账结果"标签页查看每个人应付的金额</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑弹窗 -->
  <NModal v-model:show="showEditModal" preset="card" class="edit-modal">
    <template #header>
      <div class="modal-header">
        <NIcon size="22">
          <Icon icon="mdi:pencil" />
        </NIcon>
        <span>编辑消费项目</span>
      </div>
    </template>

    <div class="modal-content">
      <div class="form-group">
        <label class="form-label">消费项目名称</label>
        <NInput v-model:value="editingExpense.name" placeholder="消费项目名称" round />
      </div>

      <div class="form-group">
        <label class="form-label">消费金额</label>
        <NInputNumber v-model:value="editingExpense.amount" placeholder="金额" :precision="2" :min="0" class="w-full"
          round>
          <template #prefix>¥</template>
        </NInputNumber>
      </div>

      <div class="form-group">
        <label class="form-label">参与人员</label>
        <div class="participants-tags edit-participants">
          <NTag v-for="participant in splitStore.participants" :key="participant.id"
            :type="editingExpense.participants.includes(participant.id) ? 'primary' : 'default'" :bordered="false" round
            size="medium" class="participant-tag" @click="toggleEditParticipant(participant.id)">
            {{ participant.name }}
          </NTag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <NButton @click="showEditModal = false" round quaternary>取消</NButton>
        <NButton @click="saveExpense" type="primary" round>保存修改</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  NInput,
  NInputNumber,
  NButton,
  NModal,
  NIcon,
  NDataTable,
  NSpace,
  NTag,
  NPopconfirm,
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
    width: 160,
    render(row) {
      return h("div", { class: "expense-item-actions" }, [
        h(
          NButton,
          {
            size: "small",
            quaternary: true,
            class: "action-button edit-button",
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
                  class: "action-button delete-button",
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

<style scoped>
.expense-manager {
  max-width: 1200px;
  margin: 0 auto;
}

.expense-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

/* 卡片样式 */
.expense-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 24px;
  height: 100%;
}

.expense-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.expense-card-icon {
  margin-right: 12px;
  color: #667eea;
}

.expense-card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 表单样式 */
.expense-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-left: 4px;
}

.expense-input {
  width: 100%;
}

.empty-participants {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  color: #888;
  font-size: 13px;
}

.participants-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participants-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.participant-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.participant-tag:hover {
  transform: translateY(-2px);
}

.participants-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.submit-button {
  margin-top: 8px;
  height: 44px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 总计卡片 */
.expense-summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  margin-top: 20px;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-main {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.summary-amount {
  font-size: 28px;
  font-weight: 700;
}

.summary-details {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #8c8c8c;
}

.empty-icon-container {
  background: rgba(102, 126, 234, 0.1);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  color: #667eea;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #555;
}

.empty-desc {
  font-size: 14px;
  color: #888;
}

/* 表格样式 */
.expense-table-container {
  overflow-x: auto;
}

.expense-table :deep(.n-data-table-th) {
  background-color: #f8fafc;
  font-weight: 600;
}

.expense-item-name {
  font-weight: 500;
  color: #333;
}

.expense-item-amount {
  font-weight: 600;
  color: #f5576c;
}

.expense-item-participants {
  font-size: 13px;
  color: #555;
}

.expense-item-average {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

.expense-item-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-button:hover {
  color: #667eea;
}

.delete-button:hover {
  color: #f5576c;
}

/* 提示卡片 */
.expense-tip-card {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  border-radius: 16px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: 0 4px 16px rgba(132, 250, 176, 0.2);
}

.tip-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tip-icon {
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.tip-title {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 4px;
}

.tip-desc {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.7);
}

/* 编辑弹窗 */
.edit-modal {
  width: 500px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

.edit-participants {
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .expense-container {
    grid-template-columns: 1fr;
  }

  .expense-card {
    padding: 16px;
  }

  .expense-card-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .expense-card-title {
    font-size: 16px;
  }

  .summary-amount {
    font-size: 24px;
  }
}
</style>