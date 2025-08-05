<!--
 * @Author: baiwumm me@baiwumm.com
 * @FilePath: \SplitCat\src\components\SplitResults.vue
 * @Description: 分账结果组件 - 现代化简洁版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  NCard,
  NEmpty,
  NIcon,
  NButton,
  NDataTable,
  NSpace,
  NTag,
  NPopover,
  NList,
  NListItem,
  NText,
  NModal,
  NInput,
  useMessage,
} from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { h, ref, computed } from "vue";

import { useSplitStore, type Participant } from "@/stores/splitStore";

const splitStore = useSplitStore();
const message = useMessage();

// 分享相关
const showShareModal = ref(false);
const shareLink = ref("");
const shareTitle = ref("分账猫 - 分账结果");

// 计算每个人的消费和应付金额
const participantSummary = computed(() => {
  const summary: Record<
    string,
    {
      id: string;
      name: string;
      paid: number;
      consumed: number;
      balance: number;
      details: Array<{ name: string; amount: number }>;
    }
  > = {};

  // 初始化每个参与者的数据
  splitStore.participants.forEach((participant) => {
    summary[participant.id] = {
      id: participant.id,
      name: participant.name,
      paid: 0,
      consumed: 0,
      balance: 0,
      details: [],
    };
  });

  // 计算每个人支付的金额
  splitStore.expenses.forEach((expense) => {
    // 找到支付者
    const payer = summary[expense.payerId];
    if (payer) {
      payer.paid += expense.amount;
    }

    // 计算每个参与者应该消费的金额
    const perPerson = expense.amount / expense.participants.length;
    expense.participants.forEach((participantId) => {
      const participant = summary[participantId];
      if (participant) {
        participant.consumed += perPerson;
        participant.details.push({
          name: expense.name,
          amount: perPerson,
        });
      }
    });
  });

  // 计算每个人的余额
  Object.values(summary).forEach((person) => {
    person.balance = person.paid - person.consumed;
  });

  return Object.values(summary);
});

// 计算转账方案
const transferPlan = computed(() => {
  const debtors = participantSummary.value
    .filter((p) => p.balance < 0)
    .sort((a, b) => a.balance - b.balance);
  const creditors = participantSummary.value
    .filter((p) => p.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  const transfers: Array<{
    from: string;
    to: string;
    amount: number;
  }> = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const debtAmount = Math.abs(debtor.balance);
    const creditAmount = creditor.balance;

    const transferAmount = Math.min(debtAmount, creditAmount);
    
    // 避免添加金额为0的转账
    if (transferAmount > 0) {
      transfers.push({
        from: debtor.id,
        to: creditor.id,
        amount: parseFloat(transferAmount.toFixed(2)),
      });
    }

    if (debtAmount < creditAmount) {
      // 债务人已还清，移动到下一个债务人
      creditor.balance -= debtAmount;
      i++;
    } else if (debtAmount > creditAmount) {
      // 债权人已收回全部，移动到下一个债权人
      debtor.balance += creditAmount;
      j++;
    } else {
      // 两者金额相等，同时移动
      i++;
      j++;
    }
  }

  return transfers;
});

// 表格列定义
const columns = computed<DataTableColumns<any>>(() => [
  {
    title: "参与者",
    key: "name",
    render(row) {
      return h("div", { class: "participant-name" }, row.name);
    },
  },
  {
    title: "支付金额",
    key: "paid",
    render(row) {
      return h("div", { class: "amount paid-amount" }, `¥${row.paid.toFixed(2)}`);
    },
  },
  {
    title: "消费金额",
    key: "consumed",
    render(row) {
      return h(
        NPopover,
        {
          trigger: "hover",
          placement: "top",
          width: 250,
        },
        {
          trigger: () =>
            h("div", { class: "amount consumed-amount" }, `¥${row.consumed.toFixed(2)}`),
          default: () =>
            h(
              NList,
              { bordered: false, size: "small" },
              {
                header: () => h("div", { class: "popover-header" }, "消费明细"),
                default: () =>
                  row.details.map((detail: any) =>
                    h(
                      NListItem,
                      {},
                      {
                        default: () =>
                          h("div", { class: "detail-item" }, [
                            h("span", { class: "detail-name" }, detail.name),
                            h("span", { class: "detail-amount" }, `¥${detail.amount.toFixed(2)}`),
                          ]),
                      }
                    )
                  ),
              }
            ),
        }
      );
    },
  },
  {
    title: "结算",
    key: "balance",
    render(row) {
      const isPositive = row.balance > 0;
      const isZero = row.balance === 0;
      
      return h(
        "div",
        {
          class: [
            "amount",
            "balance-amount",
            isPositive ? "positive-balance" : isZero ? "zero-balance" : "negative-balance",
          ],
        },
        isZero
          ? "已结清"
          : isPositive
          ? `应收 ¥${row.balance.toFixed(2)}`
          : `应付 ¥${Math.abs(row.balance).toFixed(2)}`
      );
    },
  },
]);

// 转账表格列定义
const transferColumns = computed<DataTableColumns<any>>(() => [
  {
    title: "付款人",
    key: "from",
    render(row) {
      const person = splitStore.participants.find((p) => p.id === row.from);
      return h("div", { class: "transfer-person from-person" }, person?.name || "未知");
    },
  },
  {
    title: "收款人",
    key: "to",
    render(row) {
      const person = splitStore.participants.find((p) => p.id === row.to);
      return h("div", { class: "transfer-person to-person" }, person?.name || "未知");
    },
  },
  {
    title: "金额",
    key: "amount",
    render(row) {
      return h("div", { class: "transfer-amount" }, `¥${row.amount.toFixed(2)}`);
    },
  },
]);

// 生成分享链接
const generateShareLink = () => {
  // 在实际应用中，这里应该调用后端API生成一个唯一的分享链接
  // 这里只是模拟一个链接
  const baseUrl = window.location.origin;
  const randomId = Math.random().toString(36).substring(2, 10);
  shareLink.value = `${baseUrl}/share/${randomId}`;
  showShareModal.value = true;
};

// 复制分享链接
const copyShareLink = () => {
  navigator.clipboard.writeText(shareLink.value).then(
    () => {
      message.success("链接已复制到剪贴板");
    },
    () => {
      message.error("复制失败，请手动复制");
    }
  );
};

// 导出为图片
const exportAsImage = () => {
  message.info("导出图片功能开发中...");
};

// 导出为Excel
const exportAsExcel = () => {
  message.info("导出Excel功能开发中...");
};

// 检查是否有数据可以显示
const hasData = computed(() => {
  return splitStore.participants.length > 0 && splitStore.expenses.length > 0;
});
</script>

<template>
  <div class="split-results">
    <!-- 无数据状态 -->
    <div v-if="!hasData" class="empty-state">
      <NEmpty description="暂无分账数据">
        <template #icon>
          <NIcon size="64" class="empty-icon">
            <Icon icon="mdi:calculator-off" />
          </NIcon>
        </template>
        <template #extra>
          <NSpace vertical>
            <NText depth="3">请先添加参与者和消费项目</NText>
            <NSpace>
              <NButton @click="$emit('switchTab', 'participants')" round>
                <template #icon>
                  <NIcon>
                    <Icon icon="mdi:account-group" />
                  </NIcon>
                </template>
                添加参与者
              </NButton>
              <NButton @click="$emit('switchTab', 'expenses')" type="primary" round>
                <template #icon>
                  <NIcon>
                    <Icon icon="mdi:cash-multiple" />
                  </NIcon>
                </template>
                录入消费
              </NButton>
            </NSpace>
          </NSpace>
        </template>
      </NEmpty>
    </div>

    <!-- 有数据状态 -->
    <div v-else class="results-container">
      <!-- 结果摘要 -->
      <NCard class="summary-card">
        <template #header>
          <div class="card-header">
            <NIcon size="20" class="card-icon">
              <Icon icon="mdi:information" />
            </NIcon>
            <span>分账摘要</span>
          </div>
        </template>

        <div class="summary-content">
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-icon">
                <NIcon size="24">
                  <Icon icon="mdi:account-group" />
                </NIcon>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ splitStore.participants.length }}</div>
                <div class="stat-label">参与人数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <NIcon size="24">
                  <Icon icon="mdi:receipt-text" />
                </NIcon>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ splitStore.expenses.length }}</div>
                <div class="stat-label">消费项目</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <NIcon size="24">
                  <Icon icon="mdi:cash" />
                </NIcon>
              </div>
              <div class="stat-data">
                <div class="stat-value">¥{{ splitStore.totalAmount.toFixed(2) }}</div>
                <div class="stat-label">总金额</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <NIcon size="24">
                  <Icon icon="mdi:calculator" />
                </NIcon>
              </div>
              <div class="stat-data">
                <div class="stat-value">¥{{ (splitStore.totalAmount / splitStore.participants.length).toFixed(2) }}</div>
                <div class="stat-label">人均消费</div>
              </div>
            </div>
          </div>

          <div class="summary-actions">
            <NSpace>
              <NButton @click="generateShareLink" round>
                <template #icon>
                  <NIcon>
                    <Icon icon="mdi:share-variant" />
                  </NIcon>
                </template>
                分享结果
              </NButton>
              <NButton @click="exportAsImage" round>
                <template #icon>
                  <NIcon>
                    <Icon icon="mdi:image-outline" />
                  </NIcon>
                </template>
                导出图片
              </NButton>
              <NButton @click="exportAsExcel" round>
                <template #icon>
                  <NIcon>
                    <Icon icon="mdi:file-excel-outline" />
                  </NIcon>
                </template>
                导出Excel
              </NButton>
            </NSpace>
          </div>
        </div>
      </NCard>

      <!-- 个人结算表 -->
      <NCard class="results-card">
        <template #header>
          <div class="card-header">
            <NIcon size="20" class="card-icon">
              <Icon icon="mdi:account-cash" />
            </NIcon>
            <span>个人结算表</span>
          </div>
        </template>

        <div class="results-table-container">
          <NDataTable :columns="columns" :data="participantSummary" :bordered="false" />
        </div>
      </NCard>

      <!-- 转账方案 -->
      <NCard class="transfer-card">
        <template #header>
          <div class="card-header">
            <NIcon size="20" class="card-icon">
              <Icon icon="mdi:bank-transfer" />
            </NIcon>
            <span>最优转账方案</span>
            <NTag v-if="transferPlan.length > 0" class="count-tag" type="success" size="small" round>
              {{ transferPlan.length }}笔
            </NTag>
          </div>
        </template>

        <div v-if="transferPlan.length === 0" class="empty-transfers">
          <NIcon size="24">
            <Icon icon="mdi:check-circle" />
          </NIcon>
          <span>所有人已结清，无需转账</span>
        </div>
        <div v-else class="transfer-table-container">
          <NDataTable :columns="transferColumns" :data="transferPlan" :bordered="false" />
        </div>
      </NCard>
    </div>

    <!-- 分享弹窗 -->
    <NModal v-model:show="showShareModal" preset="card" class="share-modal">
      <template #header>
        <div class="modal-header">
          <NIcon size="20">
            <Icon icon="mdi:share-variant" />
          </NIcon>
          <span>分享分账结果</span>
        </div>
      </template>

      <div class="modal-content">
        <div class="form-group">
          <label>分享标题</label>
          <NInput v-model:value="shareTitle" placeholder="输入分享标题" />
        </div>

        <div class="form-group">
          <label>分享链接</label>
          <div class="share-link-container">
            <NInput v-model:value="shareLink" readonly />
            <NButton @click="copyShareLink" type="primary">
              <template #icon>
                <NIcon>
                  <Icon icon="mdi:content-copy" />
                </NIcon>
              </template>
              复制
            </NButton>
          </div>
        </div>

        <div class="share-qrcode">
          <div class="qrcode-placeholder">
            <NIcon size="64">
              <Icon icon="mdi:qrcode" />
            </NIcon>
            <span>扫码分享</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <NButton @click="showShareModal = false" round>关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.split-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 卡片样式 */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-icon {
  color: var(--primary-color);
}

.count-tag {
  margin-left: 0.25rem;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-icon {
  color: var(--primary-color);
}

/* 结果容器 */
.results-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 摘要卡片 */
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
}

.stat-data {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.summary-actions {
  display: flex;
  justify-content: flex-end;
}

/* 表格样式 */
.results-table-container,
.transfer-table-container {
  overflow-x: auto;
}

.participant-name {
  font-weight: 500;
  color: var(--text-primary);
}

.amount {
  font-weight: 500;
}

.paid-amount {
  color: #f59e0b;
}

.consumed-amount {
  color: #10b981;
  cursor: help;
  text-decoration: underline dotted;
  text-decoration-thickness: 1px;
}

.balance-amount {
  font-weight: 600;
}

.positive-balance {
  color: #10b981;
}

.negative-balance {
  color: #f43f5e;
}

.zero-balance {
  color: #6b7280;
}

/* 转账表格 */
.transfer-person {
  font-weight: 500;
}

.from-person {
  color: #f43f5e;
}

.to-person {
  color: #10b981;
}

.transfer-amount {
  font-weight: 600;
  color: var(--primary-color);
}

.empty-transfers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #10b981;
  font-weight: 500;
}

/* 消费明细弹窗 */
.popover-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-name {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-amount {
  font-weight: 500;
  color: var(--text-primary);
}

/* 分享弹窗 */
.share-modal {
  width: 500px;
  max-width: 90vw;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.share-link-container {
  display: flex;
  gap: 0.5rem;
}

.share-qrcode {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.qrcode-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-tertiary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>