import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { calculateAllocation } from "@/lib/allocation";

// DB接続設定（環境に合わせて既存のprismaインスタンスを参照してください）
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Promise 型に変更
) {
  // /api/orders/【受注ID】/allocate というURLで注文ボタンが呼び出される
  // どの注文ボタンが押されたかを取得
  const { id: orderId } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. 受注データを取得
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("指定された受注が存在しません");
      }
      if (order.status === "ALLOCATED") {
        throw new Error("この受注はすでに引き当て済みです");
      }

      // 2. 受注アイテムの利用可能在庫を取得
      const availableInventories = await tx.inventory.findMany({
        where: {
          itemId: order.itemId,
          quantity: { gt: 0 },
        },
      });

      // 3. FIFOアルゴリズムで引き当て計算
      const allocationResult = calculateAllocation(
        order.quantity,
        availableInventories
      );

      if (allocationResult.plans.length === 0) {
        throw new Error("引き当て可能な在庫がありません");
      }

      // 4. DB更新処理
      for (const plan of allocationResult.plans) {
        // A) Allocation（引き当て履歴）レコード作成
        await tx.allocation.create({
          data: {
            orderId: order.id,
            inventoryId: plan.inventoryId,
            quantity: plan.quantity,
          },
        });

        // B) Inventory（在庫）の減算
        await tx.inventory.update({
          where: { id: plan.inventoryId },
          data: {
            quantity: { decrement: plan.quantity },
          },
        });
      }

      // C) 受注ステータスの更新（全額引当: ALLOCATED, 一部引当: PARTIAL）
      const newStatus = allocationResult.isFullyAllocated
        ? "ALLOCATED"
        : "PARTIAL";

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });

      return {
        order: updatedOrder,
        shortageQuantity: allocationResult.shortageQuantity,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}