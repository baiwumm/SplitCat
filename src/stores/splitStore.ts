import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

// 消费项目接口
export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  participants: string[]; // 参与此项消费的人员ID
  payerId: string; // 支付者ID
  category?: string;
  date?: string;
}

// 参与人员接口
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

// 分账结果接口
export interface SplitResult {
  participantId: string;
  name: string;
  totalAmount: number;
  items: {
    itemName: string;
    amount: number;
  }[];
}

// 本地存储键名
const STORAGE_KEY = "splitcat-data";

export const useSplitStore = defineStore("split", () => {
  // 状态
  const participants = ref<Participant[]>([]);
  const expenses = ref<ExpenseItem[]>([]);
  const currentSessionId = ref<string>("");

  // 初始化时从本地存储加载数据
  const initFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.participants) participants.value = data.participants;
        if (data.expenses) expenses.value = data.expenses;
        if (data.currentSessionId)
          currentSessionId.value = data.currentSessionId;
      }
    } catch (e) {
      console.error("加载本地数据失败:", e);
    }
  };

  // 监听数据变化并保存到本地存储
  watch(
    [participants, expenses, currentSessionId],
    () => {
      const data = {
        participants: participants.value,
        expenses: expenses.value,
        currentSessionId: currentSessionId.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    { deep: true }
  );

  // 计算属性
  const totalAmount = computed(() => {
    return expenses.value.reduce((sum, item) => sum + item.amount, 0);
  });

  const splitResults = computed((): SplitResult[] => {
    const results: SplitResult[] = [];

    participants.value.forEach((participant) => {
      const participantExpenses = expenses.value.filter((expense) =>
        expense.participants.includes(participant.id)
      );

      let totalAmount = 0;
      const items: { itemName: string; amount: number }[] = [];

      participantExpenses.forEach((expense) => {
        const participantCount = expense.participants.length;
        const splitAmount = expense.amount / participantCount;
        totalAmount += splitAmount;
        items.push({
          itemName: expense.name,
          amount: splitAmount,
        });
      });

      results.push({
        participantId: participant.id,
        name: participant.name,
        totalAmount: Math.round(totalAmount * 100) / 100, // 保留两位小数
        items,
      });
    });

    return results;
  });

  // 方法
  const addParticipant = (name: string) => {
    const id = Date.now().toString();
    participants.value.push({
      id,
      name,
    });
    return id;
  };

  const removeParticipant = (id: string) => {
    const index = participants.value.findIndex((p) => p.id === id);
    if (index > -1) {
      participants.value.splice(index, 1);
      // 同时从所有消费项目中移除该参与者
      expenses.value.forEach((expense) => {
        expense.participants = expense.participants.filter((pId) => pId !== id);
      });
    }
  };

  const addExpense = (
    name: string,
    amount: number,
    participantIds: string[] = []
  ) => {
    const id = Date.now().toString();
    // 如果没有指定参与者，默认所有人参与
    const finalParticipants =
      participantIds.length > 0
        ? participantIds
        : participants.value.map((p) => p.id);

    expenses.value.push({
      id,
      name,
      amount,
      participants: finalParticipants,
      date: new Date().toISOString().split("T")[0],
    });
    return id;
  };

  const removeExpense = (id: string) => {
    const index = expenses.value.findIndex((e) => e.id === id);
    if (index > -1) {
      expenses.value.splice(index, 1);
    }
  };

  const updateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    const expense = expenses.value.find((e) => e.id === id);
    if (expense) {
      Object.assign(expense, updates);
    }
  };

  const clearAll = () => {
    participants.value = [];
    expenses.value = [];
    currentSessionId.value = "";
  };

  const startNewSession = () => {
    clearAll();
    currentSessionId.value = Date.now().toString();
  };

  // 导出分账结果
  const exportResults = () => {
    if (splitResults.value.length === 0) {
      return;
    }

    const data = {
      title: '分账结果',
      date: new Date().toLocaleDateString('zh-CN'),
      totalAmount: totalAmount.value,
      participantCount: participants.value.length,
      expenseCount: expenses.value.length,
      results: splitResults.value,
      expenses: expenses.value
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分账结果_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 初始化
  initFromLocalStorage();

  return {
    // 状态
    participants,
    expenses,
    currentSessionId,

    // 计算属性
    totalAmount,
    splitResults,

    // 方法
    addParticipant,
    removeParticipant,
    addExpense,
    removeExpense,
    updateExpense,
    clearAll,
    startNewSession,
    exportResults,
  };
});
