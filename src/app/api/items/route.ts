import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 受注対象となる「製品（isProduct: true）」のみ取得
    const products = await prisma.item.findMany({
      where: { isProduct: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "製品一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}