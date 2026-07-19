import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Prisma 7 は driver adapter 経由で接続する。
// スクリプト実行なので direct 接続（DIRECT_URL）を優先し、無ければ pooled にフォールバック。
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 古いデータをクリア
  await prisma.bom.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.item.deleteMany();

  // 1. アイテム（商品・原材料）の登録
  const productA = await prisma.item.create({
    data: { name: "製品A", isProduct: true },
  });
  const materialX = await prisma.item.create({
    data: { name: "原材料X", isProduct: false },
  });
  const materialY = await prisma.item.create({
    data: { name: "部品Y", isProduct: false },
  });

  // 2. BOM（部品構成表）の登録：製品A ＝ Xが2個、Yが1個
  await prisma.bom.create({
    data: { parentId: productA.id, childId: materialX.id, quantityRequired: 2 },
  });
  await prisma.bom.create({
    data: { parentId: productA.id, childId: materialY.id, quantityRequired: 1 },
  });

  // 3. 初期在庫の登録（フェーズ2の引き当てテスト用）
  await prisma.inventory.create({
    data: { itemId: materialX.id, quantity: 150, lotNumber: "LOT-X-001", expirationDate: new Date("2026-12-31") },
  });
  await prisma.inventory.create({
    data: { itemId: materialY.id, quantity: 50, lotNumber: "LOT-Y-001", expirationDate: new Date("2026-11-30") },
  });

  console.log("初期データの投入（シード）が完了しました！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
