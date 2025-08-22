<!--
 * @Author: baiwumm me@baiwumm.com
 * @FilePath: \SplitCat\src\components\SplitResults.vue
 * @Description: 分账结果组件 - 现代化简洁版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import FileSaver from "file-saver";
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
  NAvatar,
  NScrollbar,
  useMessage,
} from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { h, ref, computed } from "vue";
import * as XLSX from "xlsx";

import { useSplitStore } from "@/stores/splitStore";

const splitStore = useSplitStore();
const message = useMessage();

// 清空数据相关
const showClearConfirm = ref(false);

// 清空所有数据
const clearAllData = () => {
  splitStore.clearAll();
  message.success("已清空所有数据");
  showClearConfirm.value = false;
};

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

  // 根据支付者信息计算每个人支付的金额和消费的金额
  splitStore.expenses.forEach((expense) => {
    // 记录支付者支付的金额
    if (expense.payerId) {
      const payer = summary[expense.payerId];
      if (payer) {
        payer.paid += expense.amount;
      }
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
  const debtors = participantSummary.value.filter((p) => p.balance < 0).sort((a, b) => a.balance - b.balance);
  const creditors = participantSummary.value.filter((p) => p.balance > 0).sort((a, b) => b.balance - a.balance);

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
    align: "center",
    render(row) {
      return h(
        NTag,
        {
          type: "primary",
          size: "small",
          round: true,
          bordered: false,
        },
        {
          default: () => row.name,
          icon: () => h(Icon, { icon: "mdi:account" }),
        }
      );
    },
  },
  {
    title: "支付金额",
    key: "paid",
    align: "center",
    render(row) {
      return h("div", { class: "font-medium text-amber-500" }, `¥${row.paid.toFixed(2)}`);
    },
  },
  {
    title: "消费金额",
    key: "consumed",
    align: "center",
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
            h(
              "div",
              { class: "font-medium text-emerald-600 cursor-help underline decoration-dotted decoration-1" },
              `¥${row.consumed.toFixed(2)}`
            ),
          default: () =>
            h(
              NList,
              { bordered: false, size: "small" },
              {
                header: () => h("div", { class: "font-semibold mb-2 pb-2 border-b border-gray-200" }, "消费明细"),
                default: () =>
                  row.details.map((detail: any) =>
                    h(
                      NListItem,
                      {},
                      {
                        default: () =>
                          h("div", { class: "flex justify-between items-center" }, [
                            h("span", { class: "text-sm text-gray-600" }, detail.name),
                            h("span", { class: "font-medium text-gray-800" }, `¥${detail.amount.toFixed(2)}`),
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
    align: "center",
    render(row) {
      const isPositive = row.balance > 0;
      const isZero = row.balance === 0;

      return h(
        "div",
        {
          class: ["font-semibold", isPositive ? "text-emerald-600" : isZero ? "text-gray-500" : "text-rose-600"],
        },
        isZero ? "已结清" : isPositive ? `应收 ¥${row.balance.toFixed(2)}` : `应付 ¥${Math.abs(row.balance).toFixed(2)}`
      );
    },
  },
]);

// 转账表格列定义
const transferColumns = computed<DataTableColumns<any>>(() => [
  {
    title: "付款人",
    key: "from",
    align: "center",
    render(row) {
      const person = splitStore.participants.find((p) => p.id === row.from);
      return h(
        NTag,
        {
          type: "error",
          size: "small",
          round: true,
          bordered: false,
        },
        {
          default: () => person?.name || "未知",
          icon: () => h(Icon, { icon: "mdi:arrow-up" }),
        }
      );
    },
  },
  {
    title: "收款人",
    key: "to",
    align: "center",
    render(row) {
      const person = splitStore.participants.find((p) => p.id === row.to);
      return h(
        NTag,
        {
          type: "success",
          size: "small",
          round: true,
          bordered: false,
        },
        {
          default: () => person?.name || "未知",
          icon: () => h(Icon, { icon: "mdi:arrow-down" }),
        }
      );
    },
  },
  {
    title: "金额",
    key: "amount",
    align: "center",
    render(row) {
      return h("div", { class: "font-semibold text-indigo-600" }, `¥${row.amount.toFixed(2)}`);
    },
  },
]);

// 海报相关
const showPosterModal = ref(false);
const posterData = ref({
  title: "分账结果",
  date: "",
  totalAmount: 0,
  averageAmount: 0,
  participants: 0,
  expenses: 0,
});

// 生成海报
const generatePoster = () => {
  // 更新海报数据
  posterData.value = {
    title: "分账结果",
    date: new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
    totalAmount: splitStore.totalAmount,
    averageAmount: splitStore.totalAmount / splitStore.participants.length,
    participants: splitStore.participants.length,
    expenses: splitStore.expenses.length,
  };

  // 显示海报模态框
  showPosterModal.value = true;
};

// 导出为Excel
const exportAsExcel = () => {
  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 1. 创建个人结算表
    const summaryData = participantSummary.value.map((person) => ({
      参与者: person.name,
      支付金额: `¥${person.paid.toFixed(2)}`,
      消费金额: `¥${person.consumed.toFixed(2)}`,
      结算:
        person.balance === 0
          ? "已结清"
          : person.balance > 0
          ? `应收 ¥${person.balance.toFixed(2)}`
          : `应付 ¥${Math.abs(person.balance).toFixed(2)}`,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "个人结算表");

    // 2. 创建转账方案表
    const transferData = transferPlan.value.map((transfer) => {
      const fromPerson = splitStore.participants.find((p) => p.id === transfer.from);
      const toPerson = splitStore.participants.find((p) => p.id === transfer.to);
      return {
        付款人: fromPerson?.name || "未知",
        收款人: toPerson?.name || "未知",
        金额: `¥${transfer.amount.toFixed(2)}`,
      };
    });

    const transferSheet = XLSX.utils.json_to_sheet(transferData);
    XLSX.utils.book_append_sheet(workbook, transferSheet, "转账方案");

    // 3. 创建消费明细表
    const expenseData = splitStore.expenses.map((expense) => {
      const payer = splitStore.participants.find((p) => p.id === expense.payerId);
      const participants = expense.participants
        .map((id) => splitStore.participants.find((p) => p.id === id)?.name || "未知")
        .join(", ");

      return {
        消费项目: expense.name,
        金额: `¥${expense.amount.toFixed(2)}`,
        支付者: payer?.name || "未知",
        参与者: participants,
        日期: expense.date || "未知",
      };
    });

    const expenseSheet = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "消费明细");

    // 4. 创建摘要信息表
    const summaryInfo = [
      { 项目: "参与人数", 数值: splitStore.participants.length },
      { 项目: "消费项目数", 数值: splitStore.expenses.length },
      { 项目: "总金额", 数值: `¥${splitStore.totalAmount.toFixed(2)}` },
      { 项目: "人均消费", 数值: `¥${(splitStore.totalAmount / splitStore.participants.length).toFixed(2)}` },
    ];

    const infoSheet = XLSX.utils.json_to_sheet(summaryInfo);
    XLSX.utils.book_append_sheet(workbook, infoSheet, "摘要信息");

    // 生成Excel文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    // 生成文件名：SplitCat账单_年月日
    const now = new Date();
    const fileName = `SplitCat账单_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now
      .getDate()
      .toString()
      .padStart(2, "0")}.xlsx`;

    FileSaver.saveAs(blob, fileName);
    message.success("Excel导出成功！");
  } catch (error) {
    console.error("导出Excel失败:", error);
    message.error("导出Excel失败，请稍后重试");
  }
};

// 检查是否有数据可以显示
const hasData = computed(() => {
  return splitStore.participants.length > 0 && splitStore.expenses.length > 0;
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 无数据状态 -->
    <div v-if="!hasData" class="flex justify-center items-center min-h-[400px]">
      <NEmpty description="暂无分账数据">
        <template #icon>
          <Icon icon="mdi:calculator-off" />
        </template>
        <template #extra>
          <NSpace vertical>
            <NText depth="3">请先添加参与者和消费项目</NText>
            <NSpace>
              <NButton @click="$emit('update:currentTab', 'participants')" round>
                <template #icon>
                  <NIcon>
                    <Icon icon="mdi:account-group" />
                  </NIcon>
                </template>
                添加参与者
              </NButton>
              <NButton @click="$emit('update:currentTab', 'expenses')" type="primary" round>
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
    <div v-else class="flex flex-col gap-6">
      <!-- 结果摘要 -->
      <NCard class="bg-white rounded-lg shadow-md">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon icon="mdi:information" class="text-indigo-500 size-6" />
            <span class="text-lg font-semibold text-gray-800">分账摘要</span>
          </div>
        </template>

        <div class="flex flex-col gap-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-sm"
            >
              <div
                class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              >
                <NIcon size="24">
                  <Icon icon="mdi:account-group" />
                </NIcon>
              </div>
              <div class="flex flex-col">
                <div class="text-xl font-semibold text-gray-800">{{ splitStore.participants.length }}</div>
                <div class="text-sm text-gray-500">参与人数</div>
              </div>
            </div>
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-sm"
            >
              <div
                class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              >
                <NIcon size="24">
                  <Icon icon="mdi:receipt-text" />
                </NIcon>
              </div>
              <div class="flex flex-col">
                <div class="text-xl font-semibold text-gray-800">{{ splitStore.expenses.length }}</div>
                <div class="text-sm text-gray-500">消费项目</div>
              </div>
            </div>
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-sm"
            >
              <div
                class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              >
                <NIcon size="24">
                  <Icon icon="mdi:cash" />
                </NIcon>
              </div>
              <div class="flex flex-col">
                <div class="text-xl font-semibold text-gray-800">¥{{ splitStore.totalAmount.toFixed(2) }}</div>
                <div class="text-sm text-gray-500">总金额</div>
              </div>
            </div>
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-sm"
            >
              <div
                class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
              >
                <NIcon size="24">
                  <Icon icon="mdi:calculator" />
                </NIcon>
              </div>
              <div class="flex flex-col">
                <div class="text-xl font-semibold text-gray-800">
                  ¥{{ (splitStore.totalAmount / splitStore.participants.length).toFixed(2) }}
                </div>
                <div class="text-sm text-gray-500">人均消费</div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <NButton @click="showClearConfirm = true" type="warning" round>
              <template #icon>
                <NIcon>
                  <Icon icon="mdi:delete-sweep" />
                </NIcon>
              </template>
              清空数据
            </NButton>

            <NSpace>
              <NButton @click="generatePoster" round>
                <template #icon>
                  <NIcon>
                    <Icon icon="mdi:image-outline" />
                  </NIcon>
                </template>
                生成海报
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
      <NCard class="bg-white rounded-lg shadow-md">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon icon="mdi:account-cash" class="text-indigo-500 size-6" />
            <span class="text-lg font-semibold text-gray-800">个人结算表</span>
          </div>
        </template>

        <div class="overflow-x-auto">
          <NDataTable :columns="columns" :data="participantSummary" :bordered="false" />
        </div>
      </NCard>

      <!-- 转账方案 -->
      <NCard class="bg-white rounded-lg shadow-md">
        <template #header>
          <div class="flex items-center gap-2">
            <Icon icon="mdi:bank-transfer" class="text-indigo-500 size-6" />
            <span class="text-lg font-semibold text-gray-800">最优转账方案</span>
            <NTag v-if="transferPlan.length > 0" class="ml-1" type="success" size="small" round>
              {{ transferPlan.length }}笔
            </NTag>
          </div>
        </template>

        <div
          v-if="transferPlan.length === 0"
          class="flex items-center justify-center gap-2 py-8 text-emerald-600 font-medium"
        >
          <NIcon size="24">
            <Icon icon="mdi:check-circle" />
          </NIcon>
          <span>所有人已结清，无需转账</span>
        </div>
        <div v-else class="overflow-x-auto">
          <NDataTable :columns="transferColumns" :data="transferPlan" :bordered="false" />
        </div>
      </NCard>
    </div>

    <!-- 清空数据确认弹窗 -->
    <NModal
      v-model:show="showClearConfirm"
      preset="dialog"
      title="确认清空数据"
      positive-text="确认清空"
      negative-text="取消"
      @positive-click="clearAllData"
      @negative-click="showClearConfirm = false"
    >
      <div class="flex flex-col gap-4 py-2">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600">
            <NIcon size="24">
              <Icon icon="mdi:alert" />
            </NIcon>
          </div>
          <div class="text-lg font-medium text-gray-800">确定要清空所有数据吗？</div>
        </div>
        <div class="text-gray-600 pl-12">
          <p>此操作将清空所有参与者和消费记录，且无法恢复。</p>
          <p class="mt-2 text-amber-600 font-medium">请确认是否继续？</p>
        </div>
      </div>
    </NModal>

    <!-- 海报模态框 -->
    <NModal v-model:show="showPosterModal" style="width: 100%; max-width: 600px" preset="card">
      <div class="flex flex-col gap-6">
        <!-- 海报标题 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600">
              <NIcon size="24">
                <Icon icon="mdi:file-document-outline" />
              </NIcon>
            </div>
            <div class="text-xl font-semibold text-gray-800">分账结果海报</div>
          </div>
        </div>

        <!-- 海报内容 -->
        <div class="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-100 shadow-sm">
          <div class="flex flex-col gap-6">
            <!-- 海报头部 -->
            <div class="flex flex-col items-center gap-2">
              <div
                class="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              >
                <NIcon size="32">
                  <Icon icon="mdi:calculator" />
                </NIcon>
              </div>
              <h2 class="text-2xl font-bold text-gray-800">SplitCat 分账结果</h2>
              <p class="text-gray-500">{{ posterData.date }}</p>
            </div>

            <!-- 摘要信息 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                <div class="text-sm text-gray-500">总金额</div>
                <div class="text-xl font-bold text-indigo-600">¥{{ posterData.totalAmount.toFixed(2) }}</div>
              </div>
              <div class="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                <div class="text-sm text-gray-500">人均消费</div>
                <div class="text-xl font-bold text-indigo-600">¥{{ posterData.averageAmount.toFixed(2) }}</div>
              </div>
              <div class="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                <div class="text-sm text-gray-500">参与人数</div>
                <div class="text-xl font-bold text-indigo-600">{{ posterData.participants }} 人</div>
              </div>
              <div class="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                <div class="text-sm text-gray-500">消费项目</div>
                <div class="text-xl font-bold text-indigo-600">{{ posterData.expenses }} 项</div>
              </div>
            </div>

            <!-- 个人结算表 -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <NIcon size="18" class="text-indigo-500">
                  <Icon icon="mdi:account-cash" />
                </NIcon>
                <h3 class="font-semibold text-gray-800">个人结算表</h3>
              </div>
              <NScrollbar>
                <div class="flex flex-col gap-2">
                  <div
                    v-for="person in participantSummary"
                    :key="person.id"
                    class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  >
                    <div class="flex items-center gap-3">
                      <NAvatar
                        size="small"
                        round
                        :style="{
                          background:
                            person.balance > 0
                              ? 'linear-gradient(to right, #10b981, #059669)'
                              : person.balance < 0
                              ? 'linear-gradient(to right, #f43f5e, #e11d48)'
                              : 'linear-gradient(to right, #6b7280, #4b5563)',
                        }"
                      >
                        {{ person.name.substring(0, 1) }}
                      </NAvatar>
                      <span class="font-medium">{{ person.name }}</span>
                    </div>
                    <div
                      :class="[
                        'font-semibold',
                        person.balance > 0
                          ? 'text-emerald-600'
                          : person.balance < 0
                          ? 'text-rose-600'
                          : 'text-gray-500',
                      ]"
                    >
                      {{
                        person.balance === 0
                          ? "已结清"
                          : person.balance > 0
                          ? `应收 ¥${person.balance.toFixed(2)}`
                          : `应付 ¥${Math.abs(person.balance).toFixed(2)}`
                      }}
                    </div>
                  </div>
                </div>
              </NScrollbar>
            </div>

            <!-- 转账方案 -->
            <div v-if="transferPlan.length > 0" class="flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <NIcon size="18" class="text-indigo-500">
                  <Icon icon="mdi:bank-transfer" />
                </NIcon>
                <h3 class="font-semibold text-gray-800">最优转账方案</h3>
                <NTag class="ml-1" type="success" size="small" round>{{ transferPlan.length }}笔</NTag>
              </div>
              <NScrollbar style="max-height: 200px">
                <div class="flex flex-col gap-2">
                  <div
                    v-for="(transfer, index) in transferPlan"
                    :key="index"
                    class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  >
                    <div class="flex items-center gap-2">
                      <NTag type="error" size="small" round>
                        {{ splitStore.participants.find((p) => p.id === transfer.from)?.name || "未知" }}
                      </NTag>
                      <NIcon>
                        <Icon icon="mdi:arrow-right" />
                      </NIcon>
                      <NTag type="success" size="small" round>
                        {{ splitStore.participants.find((p) => p.id === transfer.to)?.name || "未知" }}
                      </NTag>
                    </div>
                    <div class="font-semibold text-indigo-600">¥{{ transfer.amount.toFixed(2) }}</div>
                  </div>
                </div>
              </NScrollbar>
            </div>
            <div v-else class="flex items-center justify-center gap-2 py-4 text-emerald-600 font-medium">
              <NIcon size="20">
                <Icon icon="mdi:check-circle" />
              </NIcon>
              <span>所有人已结清，无需转账</span>
            </div>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="flex justify-end">
          <NButton type="primary" round @click="showPosterModal = false">
            <template #icon>
              <NIcon>
                <Icon icon="mdi:check" />
              </NIcon>
            </template>
            关闭
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>
