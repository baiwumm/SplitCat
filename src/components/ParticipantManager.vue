<!--
 * @Author: baiwumm me@baiwumm.com
 * @FilePath: \SplitCat\src\components\ParticipantManager.vue
 * @Description: 参与人员管理组件 - 现代化简洁版
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
    align: 'center',
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
      return h("div", { class: "flex flex-col" }, [
        h("span", { class: "font-medium text-gray-800" }, row.name),
        h("span", { class: "text-xs text-gray-500" }, `#${row.id.slice(-4)}`),
      ]);
    },
  },
  {
    title: "参与项目",
    key: "expenseCount",
    width: 120,
    align: 'center',
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
    align: 'center',
    render: (row: any) => {
      return h(
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
      )
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
  <div class="space-y-6">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 参与人数卡片 -->
      <NCard hoverable class="!rounded-xl">
        <div class="flex justify-center items-center gap-2">
          <div
            class="w-14 h-14 rounded-full bg-indigo-500 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200">
            <NIcon size="24" class="text-white">
              <Icon icon="mdi:account-group" />
            </NIcon>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800">{{ splitStore.participants.length }}</div>
            <div class="text-sm text-gray-500 font-medium">参与人数</div>
          </div>
        </div>
      </NCard>

      <!-- 消费项目卡片 -->
      <NCard hoverable class="!rounded-xl">
        <div class="flex justify-center items-center gap-2">
          <div
            class="w-14 h-14 rounded-full bg-amber-500 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
            <NIcon size="24" class="text-white">
              <Icon icon="mdi:cash-multiple" />
            </NIcon>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800">{{ splitStore.expenses.length }}</div>
            <div class="text-sm text-gray-500 font-medium">消费项目</div>
          </div>
        </div>
      </NCard>

      <!-- 总金额卡片 -->
      <NCard hoverable class="!rounded-xl">
        <div class="flex justify-center items-center gap-2">
          <div
            class="w-14 h-14 rounded-full bg-emerald-500 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
            <NIcon size="24" class="text-white">
              <Icon icon="mdi:currency-cny" />
            </NIcon>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800">¥{{ splitStore.totalAmount.toFixed(2) }}</div>
            <div class="text-sm text-gray-500 font-medium">总金额</div>
          </div>
        </div>
      </NCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：添加参与者 -->
      <n-card hoverable class="!rounded-xl">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Icon icon="mdi:account-plus-outline" class="size-5 text-indigo-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-800">添加新参与者</h3>
          </div>

          <div class="flex flex-col gap-4 mt-4">
            <NInputGroup>
              <NInputGroupLabel>姓名</NInputGroupLabel>
              <NInput v-model:value="newParticipantName" placeholder="输入参与者姓名" @keyup.enter="addParticipant" round />
            </NInputGroup>

            <NButton @click="addParticipant" type="primary" :disabled="!newParticipantName.trim()" round block
              class="h-10">
              <template #icon>
                <NIcon>
                  <Icon icon="mdi:plus" />
                </NIcon>
              </template>
              添加参与者
            </NButton>
          </div>

          <!-- 快速添加常用联系人 -->
          <n-divider>
            <template #default>
              <div class="flex items-center gap-1 text-sm text-gray-500">
                <Icon icon="mdi:lightning-bolt" size="16" />
                <span>快速添加</span>
              </div>
            </template>
          </n-divider>

          <div class="flex flex-wrap gap-2">
            <NTag v-for="contact in commonContacts" :key="contact" @click="quickAddParticipant(contact)"
              class="!cursor-pointer" :bordered="false" round size="medium" type="success"
              :disabled="splitStore.participants.some((p) => p.name === contact)">
              <template #icon>
                <Icon icon="mdi:account" />
              </template>
              {{ contact }}
            </NTag>
          </div>
        </div>
      </n-card>

      <!-- 右侧：参与者列表 -->
      <n-card hoverable class="!rounded-xl lg:col-span-2">

        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Icon icon="mdi:format-list-bulleted" class="text-indigo-500 size-6" />
            </div>
            <h3 class="text-lg font-semibold text-gray-800">参与者列表</h3>
          </div>
          <NTag v-if="splitStore.participants.length > 0" type="success" size="small" round>
            {{ splitStore.participants.length }}人
          </NTag>
        </div>

        <!-- 搜索栏 -->
        <div v-if="splitStore.participants.length > 0" class="mb-4">
          <NInput v-model:value="searchKeyword" placeholder="搜索参与者..." round>
            <template #prefix>
              <Icon icon="mdi:magnify" />
            </template>
          </NInput>
        </div>

        <!-- 空状态 -->
        <div v-if="splitStore.participants.length === 0" class="py-12 flex flex-col items-center justify-center">
          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <NIcon size="32" class="text-gray-400">
              <Icon icon="mdi:account-group-outline" />
            </NIcon>
          </div>
          <div class="text-gray-500 font-medium">还没有添加参与者</div>
          <div class="text-sm text-gray-400 mt-1">请先添加参与分账的朋友</div>
        </div>

        <!-- 搜索无结果 -->
        <div v-else-if="filteredParticipants.length === 0" class="py-12 flex flex-col items-center justify-center">
          <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <NIcon size="32" class="text-gray-400">
              <Icon icon="mdi:magnify" />
            </NIcon>
          </div>
          <div class="text-gray-500 font-medium">没有找到匹配的参与者</div>
          <div class="text-sm text-gray-400 mt-1">请尝试其他搜索关键词</div>
        </div>

        <!-- 参与者表格 -->
        <div v-else>
          <div class="rounded-lg overflow-hidden mb-4">
            <NDataTable :columns="columns" :data="filteredParticipants" :pagination="{ pageSize: 8 }" :bordered="false"
              :single-line="false" />
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end pt-4 border-t border-gray-100">
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
        </div>
      </n-card>
    </div>

    <!-- 操作提示 -->
    <div v-if="splitStore.participants.length > 0"
      class="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <NIcon size="20" class="text-amber-500">
            <Icon icon="mdi:lightbulb-outline" />
          </NIcon>
        </div>
        <div>
          <p class="font-medium text-amber-800 mb-1">下一步</p>
          <p class="text-amber-700 text-sm">添加完参与者后，点击上方"消费录入"开始记录消费项目</p>
        </div>
      </div>
    </div>
  </div>
</template>