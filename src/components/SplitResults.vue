<!--
 * @Author: baiwumm me@baiwumm.com
 * @FilePath: \SplitCat\src\components\SplitResults.vue
 * @Description: 分账结果组件 - 现代化重构版
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
-->
<script setup lang="ts">
import { h, ref, computed } from "vue";
import {
    NButton,
    NIcon,
    NDataTable,
    NSwitch,
    NPopover,
    NTag,
    NCard,
    NEmpty,
    useMessage
} from "naive-ui";
import { Icon } from "@iconify/vue";
import type { DataTableColumns } from "naive-ui";

import { useSplitStore } from "@/stores/splitStore";
import type { SplitResult, Participant } from "@/stores/splitStore";

const splitStore = useSplitStore();
const message = useMessage();

// 支付状态管理
const sortDirection = ref<"asc" | "desc">("desc");

// 从localStorage获取支付状态，如果没有则初始化为空对象
const initPaymentStatus = () => {
    try {
        const savedStatus = localStorage.getItem("splitcat_payment_status");
        return savedStatus ? JSON.parse(savedStatus) : {};
    } catch (e) {
        return {};
    }
};

const paymentStatus = ref<Record<string, boolean>>(initPaymentStatus());

// 计算已支付和未支付的数量
const paidCount = computed(() => {
    return Object.values(paymentStatus.value).filter(Boolean).length;
});

const unpaidCount = computed(() => {
    return splitStore.participants.length - paidCount.value;
});

// 排序后的结果
const sortedResults = computed(() => {
    return [...splitStore.splitResults].sort((a, b) => {
        return sortDirection.value === "desc"
            ? b.totalAmount - a.totalAmount
            : a.totalAmount - b.totalAmount;
    });
});

// 表格列定义
const columns = computed<DataTableColumns<SplitResult>>(() => [
    {
        title: "参与者",
        key: "name",
        render(row) {
            return h("div", { class: "participant-cell" }, [
                h(
                    "div",
                    {
                        class: "avatar",
                    },
                    row.name.charAt(0)
                ),
                h("span", { class: "name" }, row.name),
            ]);
        },
    },
    {
        title: "应付金额",
        key: "totalAmount",
        render(row) {
            return h("div", { class: "amount" }, `¥${row.totalAmount.toFixed(2)}`);
        },
        sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
        title: "消费项目",
        key: "items",
        render(row) {
            return h("div", { class: "items-cell" }, [
                h("span", { class: "item-count" }, `${row.items.length} 项`),
                h(
                    NPopover,
                    { trigger: "hover", placement: "top" },
                    {
                        trigger: () =>
                            h(
                                NButton,
                                { size: "tiny", text: true, class: "detail-btn" },
                                { default: () => "详情" }
                            ),
                        default: () =>
                            h("div", { class: "items-popover" }, [
                                h("div", { class: "popover-title" }, "消费明细："),
                                ...row.items.map((item) =>
                                    h("div", { class: "item-row" }, [
                                        h("span", { class: "item-name" }, item.itemName),
                                        h("span", { class: "item-amount" }, `¥${item.amount.toFixed(2)}`),
                                    ])
                                ),
                            ]),
                    }
                ),
            ]);
        },
    },
    {
        title: "支付状态",
        key: "paymentStatus",
        render(row) {
            const isPaid = getPaymentStatus(row.participantId);
            return h(
                NTag,
                {
                    type: isPaid ? "success" : "warning",
                    round: true,
                    size: "small",
                },
                { default: () => (isPaid ? "已支付" : "未支付") }
            );
        },
    },
]);

const getPaymentStatus = (participantId: string) => {
    return paymentStatus.value[participantId] || false;
};

// 切换支付状态并保存到localStorage
const togglePaymentStatus = (status: boolean, participantId: string) => {
    // 直接使用传入的status值，而不是取反
    paymentStatus.value[participantId] = status;

    // 保存到localStorage
    savePaymentStatus();

    const participant = splitStore.participants.find((p: Participant) => p.id === participantId);
    if (participant) {
        const statusText = status ? "已支付" : "未支付";
        message.success(`${participant.name} 状态已更新为：${statusText}`);
    }
};

// 重置支付状态并保存到localStorage
const resetPaymentStatus = () => {
    paymentStatus.value = {};
    savePaymentStatus();
    message.success("支付状态已重置");
};

// 保存支付状态到localStorage
const savePaymentStatus = () => {
    try {
        localStorage.setItem("splitcat_payment_status", JSON.stringify(paymentStatus.value));
    } catch (e) {
        console.error("保存支付状态失败:", e);
    }
};

const sortByAmount = () => {
    sortDirection.value = sortDirection.value === "desc" ? "asc" : "desc";
    message.info(`按金额${sortDirection.value === "desc" ? "降序" : "升序"}排列`);
};

const navigateTo = (tab: "participants" | "expenses") => {
    emit("update:currentTab", tab);
};

const shareResults = () => {
    // 生成分享文本
    let shareText = `🐱 分账猫 - 分账结果\n\n`;
    shareText += `💰 消费总计：¥${splitStore.totalAmount.toFixed(2)}\n`;
    shareText += `👥 参与人数：${splitStore.participants.length} 人\n`;
    shareText += `📝 消费项目：${splitStore.expenses.length} 项\n\n`;

    shareText += `📊 分账明细：\n`;
    splitStore.splitResults.forEach((result) => {
        shareText += `${result.name}：¥${result.totalAmount.toFixed(2)}\n`;
    });

    shareText += `\n🔗 使用分账猫，让聚餐分账更简单！`;

    // 尝试使用 Web Share API
    if (navigator.share) {
        navigator
            .share({
                title: "分账猫 - 分账结果",
                text: shareText,
            })
            .then(() => {
                message.success("分享成功");
            })
            .catch(() => {
                // 降级到复制到剪贴板
                copyToClipboard(shareText);
            });
    } else {
        // 降级到复制到剪贴板
        copyToClipboard(shareText);
    }
};

const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                message.success("分账结果已复制到剪贴板");
            })
            .catch(() => {
                message.error("复制失败，请手动复制");
            });
    } else {
        // 降级方案
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand("copy");
            message.success("分账结果已复制到剪贴板");
        } catch (err) {
            message.error("复制失败，请手动复制");
        }
        document.body.removeChild(textArea);
    }
};

const exportResults = () => {
    // 生成详细的账单数据
    const exportData = {
        timestamp: new Date().toISOString(),
        totalAmount: splitStore.totalAmount,
        participants: splitStore.participants,
        expenses: splitStore.expenses,
        splitResults: splitStore.splitResults,
        paymentStatus: paymentStatus.value,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `分账结果_${new Date().toLocaleDateString()}.json`;
    link.click();

    message.success("账单已导出");
};

const emit = defineEmits<{
    (e: "update:currentTab", tab: "participants" | "expenses" | "results"): void;
}>();
</script>

<template>
    <div class="split-results">
        <!-- 无数据状态 -->
        <div v-if="splitStore.participants.length === 0 || splitStore.expenses.length === 0" class="empty-state">
            <NCard class="empty-card">
                <div class="empty-content">
                    <div class="empty-icon">
                        <NIcon size="64">
                            <Icon icon="mdi:clipboard-text-outline" />
                        </NIcon>
                    </div>
                    <p class="empty-title">
                        {{ splitStore.participants.length === 0 ? "请先添加参与者" : "请先添加消费项目" }}
                    </p>
                    <p class="empty-desc">完成后即可查看分账结果</p>

                    <NButton @click="navigateTo(splitStore.participants.length === 0 ? 'participants' : 'expenses')"
                        type="primary" class="action-btn" round>
                        <template #icon>
                            <NIcon>
                                <Icon :icon="splitStore.participants.length === 0 ? 'mdi:account-plus' : 'mdi:cash-plus'
                                    " />
                            </NIcon>
                        </template>
                        {{ splitStore.participants.length === 0 ? "去添加参与者" : "去添加消费项目" }}
                    </NButton>
                </div>
            </NCard>
        </div>

        <!-- 分账结果 -->
        <div v-else class="results-container">
            <!-- 总览信息 -->
            <div class="stats-grid">
                <!-- 消费总计 -->
                <NCard class="stat-card total-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <NIcon size="28">
                                <Icon icon="mdi:cash-multiple" />
                            </NIcon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-label">消费总计</div>
                            <div class="stat-value">¥{{ splitStore.totalAmount.toFixed(2) }}</div>
                        </div>
                    </div>
                </NCard>

                <!-- 参与人数 -->
                <NCard class="stat-card participants-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <NIcon size="28">
                                <Icon icon="mdi:account-group" />
                            </NIcon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-label">参与人数</div>
                            <div class="stat-value">{{ splitStore.participants.length }} 人</div>
                        </div>
                    </div>
                </NCard>

                <!-- 消费项目 -->
                <NCard class="stat-card expenses-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <NIcon size="28">
                                <Icon icon="mdi:receipt" />
                            </NIcon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-label">消费项目</div>
                            <div class="stat-value">{{ splitStore.expenses.length }} 项</div>
                        </div>
                    </div>
                </NCard>

                <!-- 人均消费 -->
                <NCard class="stat-card average-card">
                    <div class="stat-content">
                        <div class="stat-icon">
                            <NIcon size="28">
                                <Icon icon="mdi:calculator" />
                            </NIcon>
                        </div>
                        <div class="stat-info">
                            <div class="stat-label">人均消费</div>
                            <div class="stat-value">
                                ¥{{ (splitStore.totalAmount / splitStore.participants.length).toFixed(2) }}
                            </div>
                        </div>
                    </div>
                </NCard>
            </div>

            <div class="content-grid">
                <!-- 左侧：个人分账详情 -->
                <div class="details-panel">
                    <NCard class="details-card">
                        <template #header>
                            <div class="card-header">
                                <div class="header-title">
                                    <NIcon size="22" class="header-icon">
                                        <Icon icon="mdi:file-document-outline" />
                                    </NIcon>
                                    <span>个人分账详情</span>
                                </div>
                                <div>
                                    <NButton size="small" quaternary @click="sortByAmount">
                                        <template #icon>
                                            <NIcon>
                                                <Icon icon="mdi:sort" />
                                            </NIcon>
                                        </template>
                                        按金额排序
                                    </NButton>
                                </div>
                            </div>
                        </template>

                        <div class="table-container">
                            <NDataTable :columns="columns" :data="sortedResults" :pagination="{ pageSize: 10 }"
                                :bordered="false" />
                        </div>
                    </NCard>
                </div>

                <!-- 右侧：支付状态和操作 -->
                <div class="status-panel">
                    <!-- 支付状态 -->
                    <NCard class="status-card">
                        <template #header>
                            <div class="card-header">
                                <NIcon size="22" class="header-icon">
                                    <Icon icon="mdi:check-circle-outline" />
                                </NIcon>
                                <span>支付状态</span>
                            </div>
                        </template>

                        <div class="status-summary">
                            <div class="status-box paid">
                                <div class="status-count">{{ paidCount }}</div>
                                <div class="status-label">已支付</div>
                                <NIcon size="20" class="status-icon">
                                    <Icon icon="mdi:check-circle" />
                                </NIcon>
                            </div>
                            <div class="status-box unpaid">
                                <div class="status-count">{{ unpaidCount }}</div>
                                <div class="status-label">未支付</div>
                                <NIcon size="20" class="status-icon">
                                    <Icon icon="mdi:clock-outline" />
                                </NIcon>
                            </div>
                        </div>

                        <div class="status-list">
                            <div v-for="result in splitStore.splitResults" :key="result.participantId"
                                class="status-item" :class="{ 'status-paid': getPaymentStatus(result.participantId) }">
                                <div class="status-user">
                                    <div class="user-avatar">
                                        {{ result.name.charAt(0) }}
                                    </div>
                                    <div class="user-info">
                                        <div class="user-name">{{ result.name }}</div>
                                        <div class="user-amount">¥{{ result.totalAmount.toFixed(2) }}</div>
                                    </div>
                                </div>
                                <NSwitch :value="getPaymentStatus(result.participantId)"
                                    @update:value="(status) => togglePaymentStatus(status, result.participantId)" />
                            </div>
                        </div>
                    </NCard>

                    <!-- 操作按钮 -->
                    <NCard class="actions-card">
                        <template #header>
                            <div class="card-header">
                                <NIcon size="22" class="header-icon">
                                    <Icon icon="mdi:cog-outline" />
                                </NIcon>
                                <span>操作</span>
                            </div>
                        </template>

                        <div class="actions-container">
                            <NButton @click="shareResults" type="primary" class="share-btn" round>
                                <template #icon>
                                    <NIcon>
                                        <Icon icon="mdi:share-variant" />
                                    </NIcon>
                                </template>
                                分享分账结果
                            </NButton>

                            <div class="actions-grid">
                                <NButton @click="exportResults" quaternary class="action-btn">
                                    <template #icon>
                                        <NIcon>
                                            <Icon icon="mdi:file-export" />
                                        </NIcon>
                                    </template>
                                    导出账单
                                </NButton>
                                <NButton @click="resetPaymentStatus" quaternary class="action-btn">
                                    <template #icon>
                                        <NIcon>
                                            <Icon icon="mdi:refresh" />
                                        </NIcon>
                                    </template>
                                    重置状态
                                </NButton>
                            </div>
                        </div>
                    </NCard>

                    <!-- 小贴士 -->
                    <div class="tip-card">
                        <div class="tip-content">
                            <NIcon size="24" class="tip-icon">
                                <Icon icon="mdi:lightbulb-on" />
                            </NIcon>
                            <div class="tip-text">
                                <p class="tip-title">小贴士</p>
                                <p class="tip-desc">点击"分享分账结果"可以生成分享链接，方便发送给朋友们查看</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.split-results {
    max-width: 1200px;
    margin: 0 auto;
}

/* 空状态样式 */
.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.empty-card {
    width: 100%;
    max-width: 480px;
}

.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20px;
}

.empty-icon {
    background-color: #eef2ff;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    color: #6366f1;
}

.empty-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1f2937;
}

.empty-desc {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 24px;
}

.action-btn {
    height: 44px;
    padding: 0 24px;
    font-weight: 500;
}

/* 结果容器样式 */
.results-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* 统计卡片样式 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
}

.stat-card {
    transition: all 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.total-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.participants-card {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
}

.expenses-card {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
}

.average-card {
    background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
    color: white;
}

.stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-icon {
    background: rgba(255, 255, 255, 0.2);
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-info {
    flex: 1;
}

.stat-label {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
}

/* 内容网格样式 */
.content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
}

/* 卡片通用样式 */
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1f2937;
}

.header-icon {
    color: #6366f1;
}

/* 详情面板样式 */
.details-panel {
    display: flex;
    flex-direction: column;
}

.details-card {
    height: 100%;
}

.table-container {
    margin-top: 8px;
}

/* 表格单元格样式 */
.participant-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.name {
    font-weight: 500;
}

.amount {
    font-weight: 600;
    color: #dc2626;
}

.items-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.item-count {
    font-size: 12px;
    color: #6b7280;
}

.detail-btn {
    font-size: 12px;
    color: #6366f1;
}

.items-popover {
    max-width: 250px;
    padding: 4px;
}

.popover-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #1f2937;
}

.item-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px dashed #e5e7eb;
}

.item-row:last-child {
    border-bottom: none;
}

.item-name {
    color: #6b7280;
    margin-right: 16px;
}

.item-amount {
    font-weight: 500;
}

/* 状态面板样式 */
.status-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.status-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
}

.status-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    border-radius: 12px;
    position: relative;
}

.paid {
    background-color: #ecfdf5;
    color: #065f46;
}

.unpaid {
    background-color: #fffbeb;
    color: #92400e;
}

.status-count {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
}

.status-label {
    font-size: 14px;
    font-weight: 500;
}

.status-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0.7;
}

.status-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 4px;
}

.status-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-radius: 12px;
    background-color: #fffbeb;
    transition: all 0.2s ease;
}

.status-paid {
    background-color: #ecfdf5;
}

.status-user {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.status-paid .user-avatar {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 500;
    font-size: 14px;
    color: #1f2937;
}

.user-amount {
    font-size: 12px;
    color: #6b7280;
}

/* 操作按钮样式 */
.actions-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.share-btn {
    height: 44px;
    font-weight: 500;
}

.actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.action-btn {
    height: 40px;
}

/* 小贴士样式 */
.tip-card {
    background: linear-gradient(135deg, #bbf7d0 0%, #a5f3fc 100%);
    border-radius: 16px;
    padding: 16px;
}

.tip-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.tip-icon {
    color: rgba(31, 41, 55, 0.6);
    margin-top: 2px;
}

.tip-text {
    flex: 1;
}

.tip-title {
    font-weight: 600;
    color: rgba(31, 41, 55, 0.8);
    margin: 0 0 4px 0;
}

.tip-desc {
    color: rgba(31, 41, 55, 0.7);
    margin: 0;
    font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .content-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr 1fr;
    }

    .status-summary {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}

/* 动画效果 */
.details-card,
.status-card,
.actions-card,
.tip-card {
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