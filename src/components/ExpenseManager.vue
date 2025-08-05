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
const selectedPayer = ref<string>("");

// 编辑相关
const showEditModal = ref(false);
const editingExpense = reactive({
  id: "",
  name: "",
  amount: 0,
  participants: [] as string[],
  payerId: "",
});

// 表格列定义
const columns = computed<DataTableColumns<ExpenseItem>>(() => [
  {
    title: "消费项目",
    key: "name",
    align:'center',
    render(row) {
      return h("div", { class: "font-medium text-gray-800" }, row.name);
    },
  },
  {
    title: "金额",
    key: "amount",
    align:'center',
    render(row) {
      return h("div", { class: "font-semibold text-red-500" }, `¥${row.amount.toFixed(2)}`);
    },
  },
  {
    title: "支付者",
    key: "payer",
    align: "center",
    render(row) {
      const payerName = row.payerId ? getParticipantName(row.payerId) : "未指定";
      return h(
        NTag,
        {
          type: "success",
          size: "small",
          round: true,
          bordered: false,
        },
        {
          default: () => payerName,
          icon: () => h(Icon, { icon: "mdi:cash" }),
        }
      );
    },
  },
  {
    title: "参与人员",
    key: "participants",
    align: "center",
    render(row) {
      if (row.participants.length === 0) {
        return h("div", { class: "text-sm text-gray-400" }, "无参与者");
      }
      
      // 如果参与者太多，只显示前两个并加上"等x人"
      const maxDisplay = 2;
      const displayParticipants = row.participants.slice(0, maxDisplay);
      const remainingCount = row.participants.length - maxDisplay;
      
      return h("div", { class: "flex flex-wrap gap-1 justify-center" }, [
        ...displayParticipants.map(id => {
          const name = getParticipantName(id);
          return h(
            NTag,
            {
              type: "primary",
              size: "small",
              round: true,
              bordered: false,
            },
            {
              default: () => name,
              icon: () => h(Icon, { icon: "mdi:account" }),
            }
          );
        }),
        remainingCount > 0 ? h(
          NTag,
          {
            type: "default",
            size: "small",
            round: true,
          },
          {
            default: () => `等${row.participants.length}人`,
          }
        ) : null
      ].filter(Boolean));
    },
  },
  {
    title: "人均",
    key: "average",
    align:'center',
    render(row) {
      return h("div", { class: "text-sm font-medium text-indigo-600" }, `¥${(row.amount / row.participants.length).toFixed(2)}`);
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    align:'center',
    render(row) {
      return h("div", { class: "flex gap-2" }, [
        h(
          NButton,
          {
            size: "small",
            quaternary: true,
            class: "flex items-center gap-1",
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
                  class: "flex items-center gap-1",
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

  if (!selectedPayer.value) {
    message.warning("请选择支付者");
    return;
  }

  // 确保支付者也是参与者
  if (!selectedParticipants.value.includes(selectedPayer.value)) {
    selectedParticipants.value.push(selectedPayer.value);
  }

  const expenseId = splitStore.addExpense(
    newExpense.name, 
    newExpense.amount, 
    selectedParticipants.value
  );
  
  // 更新支付者信息
  splitStore.updateExpense(expenseId, { payerId: selectedPayer.value });

  // 重置表单
  newExpense.name = "";
  newExpense.amount = 0;
  selectedParticipants.value = [];
  selectedPayer.value = "";

  message.success("消费项目添加成功");
};

const editExpense = (expense: ExpenseItem) => {
  editingExpense.id = expense.id;
  editingExpense.name = expense.name;
  editingExpense.amount = expense.amount;
  editingExpense.participants = [...expense.participants];
  editingExpense.payerId = expense.payerId || expense.participants[0] || "";
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

  if (!editingExpense.payerId) {
    message.warning("请选择支付者");
    return;
  }

  // 确保支付者也是参与者
  if (!editingExpense.participants.includes(editingExpense.payerId)) {
    editingExpense.participants.push(editingExpense.payerId);
  }

  splitStore.updateExpense(editingExpense.id, {
    name: editingExpense.name,
    amount: editingExpense.amount,
    participants: editingExpense.participants,
    payerId: editingExpense.payerId,
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

const getParticipantName = (participantId: string) => {
  const participant = splitStore.participants.find((p) => p.id === participantId);
  return participant?.name || "未知";
};

const getParticipantNames = (participantIds: string[]) => {
  return participantIds.map((id) => {
    const participant = splitStore.participants.find((p) => p.id === id);
    return participant?.name || "未知";
  });
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：添加消费项目 -->
      <div class="lg:col-span-1">
        <NCard class="bg-white rounded-lg shadow-md transition-all duration-300 h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon icon="mdi:plus-circle" class="text-indigo-500 size-6" />
                <span class="text-lg font-semibold text-gray-800">添加消费项目</span>
              </div>
            </div>
          </template>

          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <NInput v-model:value="newExpense.name" placeholder="消费项目名称" class="w-full" round>
                <template #prefix>
                  <NIcon>
                    <Icon icon="mdi:tag-outline" />
                  </NIcon>
                </template>
              </NInput>
            </div>

            <div class="flex flex-col gap-2">
              <NInputNumber v-model:value="newExpense.amount" placeholder="消费金额" :precision="2" :min="0" class="w-full"
                round>
                <template #prefix>¥</template>
              </NInputNumber>
            </div>

            <!-- 支付者选择 -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-600">支付者</span>
              </div>

              <div v-if="splitStore.participants.length === 0"
                class="flex items-center gap-2 p-3 bg-gray-100 rounded-md text-gray-500 text-sm">
                <NIcon size="18">
                  <Icon icon="mdi:account-alert" />
                </NIcon>
                <span>请先添加参与者</span>
              </div>
              <div v-else class="flex flex-col gap-3">
                <div class="flex flex-wrap gap-2">
                  <NTag v-for="participant in splitStore.participants" :key="participant.id"
                    :type="selectedPayer === participant.id ? 'success' : 'default'" :bordered="false"
                    round size="small" class="!cursor-pointer" @click="selectedPayer = participant.id">
                    {{ participant.name }}
                    <template #icon>
                      <Icon icon="mdi:cash" />
                    </template>
                  </NTag>
                </div>
              </div>
            </div>

            <!-- 参与者选择 -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-600">参与人员</span>
                <div class="flex gap-2">
                  <NButton @click="selectAllParticipants" size="tiny" text>全选</NButton>
                  <NButton @click="clearParticipants" size="tiny" text>清空</NButton>
                </div>
              </div>

              <div v-if="splitStore.participants.length === 0"
                class="flex items-center gap-2 p-3 bg-gray-100 rounded-md text-gray-500 text-sm">
                <NIcon size="18">
                  <Icon icon="mdi:account-alert" />
                </NIcon>
                <span>请先添加参与者</span>
              </div>
              <div v-else class="flex flex-col gap-3">
                <div class="flex flex-wrap gap-2">
                  <NTag v-for="participant in splitStore.participants" :key="participant.id"
                    :type="selectedParticipants.includes(participant.id) ? 'primary' : 'default'" :bordered="false"
                    round size="small" class="!cursor-pointer" @click="toggleParticipant(participant.id)">
                    {{ participant.name }}
                    <template #icon>
                      <Icon icon="mdi:account" />
                    </template>
                  </NTag>
                </div>
              </div>
            </div>

            <NButton @click="addExpense" type="primary" block round
              :disabled="!newExpense.name.trim() || !newExpense.amount || selectedParticipants.length === 0 || !selectedPayer"
              class="h-10 font-medium mt-2">
              <template #icon>
                <NIcon>
                  <Icon icon="mdi:plus" />
                </NIcon>
              </template>
              添加消费项目
            </NButton>
          </div>

          <!-- 总计信息 -->
          <div v-if="splitStore.expenses.length > 0" class="mt-6 relative overflow-hidden">
            <div class="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 rounded-2xl p-6 shadow-lg relative z-10">
              <!-- 装饰元素 -->
              <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
              <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-lg"></div>
              
              <!-- 金额显示 -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex flex-col">
                  <span class="text-white/80 text-sm font-medium mb-1">消费总计</span>
                  <div class="flex items-baseline">
                    <span class="text-white text-4xl font-bold tracking-tight">¥{{ splitStore.totalAmount.toFixed(2) }}</span>
                    <span class="text-white/70 ml-2 text-sm">CNY</span>
                  </div>
                </div>
                <div class="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon icon="mdi:currency-cny" class="text-white text-2xl" />
                </div>
              </div>
              
              <!-- 统计信息 -->
              <div class="grid grid-cols-2 gap-4 mt-6">
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon icon="mdi:receipt" class="text-white text-xl" />
                  </div>
                  <div>
                    <div class="text-white text-lg font-bold">{{ splitStore.expenses.length }}</div>
                    <div class="text-white/70 text-xs">消费项目</div>
                  </div>
                </div>
                
                <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon icon="mdi:account-group" class="text-white text-xl" />
                  </div>
                  <div>
                    <div class="text-white text-lg font-bold">{{ splitStore.participants.length }}</div>
                    <div class="text-white/70 text-xs">参与人数</div>
                  </div>
                </div>
              </div>
              
              <!-- 人均消费 -->
              <div class="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon icon="mdi:calculator" class="text-white text-xl" />
                  </div>
                  <div>
                    <div class="text-white/70 text-xs">人均消费</div>
                    <div class="text-white text-lg font-bold">¥{{ (splitStore.totalAmount / splitStore.participants.length).toFixed(2) }}</div>
                  </div>
                </div>
                <div class="text-white/60 text-xs">
                  {{ new Date().toLocaleDateString('zh-CN') }}
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      <!-- 右侧：消费列表 -->
      <div class="lg:col-span-2">
        <NCard class="bg-white rounded-lg shadow-md transition-all duration-300 h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon icon="mdi:format-list-bulleted" class="text-indigo-500 size-6" />
                <span class="text-lg font-semibold text-gray-800">消费列表</span>
                <NTag v-if="splitStore.expenses.length > 0" class="ml-2" type="success" size="small" round>
                  {{ splitStore.expenses.length }}项
                </NTag>
              </div>
            </div>
          </template>

          <!-- 无数据状态 -->
          <div v-if="splitStore.expenses.length === 0" class="py-12 flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <NIcon size="32" class="text-gray-400">
                <Icon icon="mdi:receipt-text-outline" />
              </NIcon>
            </div>
            <div class="text-gray-500 font-medium">还没有添加消费项目</div>
            <div class="text-sm text-gray-400 mt-1">请在左侧添加消费项目</div>
          </div>

          <!-- 消费列表 -->
          <div v-else class="flex flex-col">
            <div class="overflow-x-auto">
              <NDataTable :columns="columns" :data="splitStore.expenses" :pagination="{ pageSize: 10 }"
                :bordered="false" class="expense-table" />
            </div>
          </div>


          <!-- 操作提示 -->
          <NCard v-if="splitStore.expenses.length > 0"
            class="bg-gradient-to-r from-green-200 to-blue-200 mt-4 rounded-lg shadow-md">
            <div class="flex items-start gap-3">
              <NIcon size="24" class="text-gray-800/60 mt-0.5">
                <Icon icon="mdi:lightbulb-on" />
              </NIcon>
              <div>
                <p class="font-semibold text-gray-800/80 mb-1">小贴士</p>
                <p class="text-sm text-gray-800/70">添加完消费项目后，可以切换到"分账结果"查看每个人应付的金额</p>
              </div>
            </div>
          </NCard>
        </NCard>
      </div>
    </div>
  </div>

  <!-- 编辑弹窗 -->
  <NModal v-model:show="showEditModal" preset="card" class="!w-[600px]">
    <template #header>
      <div class="flex items-center gap-2 text-lg font-semibold">
        <NIcon size="20">
          <Icon icon="mdi:pencil" />
        </NIcon>
        <span>编辑消费项目</span>
      </div>
    </template>

    <div class="flex flex-col gap-5 py-2">
      <div class="flex flex-col gap-2">
        <NInput v-model:value="editingExpense.name" placeholder="消费项目名称" class="w-full" round>
          <template #prefix>
            <NIcon>
              <Icon icon="mdi:tag-outline" />
            </NIcon>
          </template>
        </NInput>
      </div>

      <div class="flex flex-col gap-2">
        <NInputNumber v-model:value="editingExpense.amount" placeholder="消费金额" :precision="2" :min="0" class="w-full"
          round>
          <template #prefix>¥</template>
        </NInputNumber>
      </div>
      
      <!-- 支付者选择 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">支付者</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <NTag v-for="participant in splitStore.participants" :key="participant.id"
            :type="editingExpense.payerId === participant.id ? 'success' : 'default'" :bordered="false" round
            size="small" class="!cursor-pointer" @click="editingExpense.payerId = participant.id">
            {{ participant.name }}
            <template #icon>
              <Icon icon="mdi:cash" />
            </template>
          </NTag>
        </div>
      </div>

      <!-- 参与人员选择 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">参与人员</span>
        </div>
        <div class="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
          <NTag v-for="participant in splitStore.participants" :key="participant.id"
            :type="editingExpense.participants.includes(participant.id) ? 'primary' : 'default'" :bordered="false" round
            size="small" class="!cursor-pointer" @click="toggleEditParticipant(participant.id)">
            {{ participant.name }}
            <template #icon>
              <Icon icon="mdi:account" />
            </template>
          </NTag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 mt-2">
        <NButton @click="showEditModal = false" round quaternary>取消</NButton>
        <NButton @click="saveExpense" type="primary" round>保存</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
/* 表格样式覆盖 */
.expense-table :deep(.n-data-table-th) {
  background-color: #f8fafc;
  font-weight: 600;
}
</style>