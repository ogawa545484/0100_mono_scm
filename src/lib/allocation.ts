type InventoryStock = {
  id: string;
  quantity: number;
  expirationDate: Date | null;
  createdAt: Date;
};

export type AllocationPlan = {
  inventoryId: string;
  quantity: number;
};

/**
 * FIFO（先入先出）ルールに基づく在庫引き当てシミュレーション関数
 * TypeScriptの配列操作（.sort() や .filter()）を使って、有効期限が古い順（FIFO）に引き当てる
 */
export function calculateAllocation(
  orderQuantity: number,
  inventories: InventoryStock[]
) {
  // 1. 有効期限が古い順（無ければ作成日時が古い順）にソート
  const sortedInventories = [...inventories].sort((a, b) => {
    if (a.expirationDate && b.expirationDate) {
      return a.expirationDate.getTime() - b.expirationDate.getTime();
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  let remainingNeed = orderQuantity;
  const plans: AllocationPlan[] = [];

  // 2. 先頭（一番古い在庫）から順に引き当て
  for (const inv of sortedInventories) {
    if (remainingNeed <= 0) break;
    if (inv.quantity <= 0) continue;

    const allocatedAmount = Math.min(inv.quantity, remainingNeed);

    plans.push({
      inventoryId: inv.id,
      quantity: allocatedAmount,
    });

    remainingNeed -= allocatedAmount;
  }

  return {
    plans,
    allocatedTotal: orderQuantity - remainingNeed, // 引き当てできた合計数
    shortageQuantity: remainingNeed,             // 不足分（バックオーダー/製造指示対象）
    isFullyAllocated: remainingNeed === 0,         // 全額引き当て完了フラグ
  };
}