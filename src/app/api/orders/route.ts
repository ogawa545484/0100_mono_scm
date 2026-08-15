import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 受注一覧の取得（商品名も結合して取得）
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        item: true, // リレーション先の Item 情報を一緒に取得
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "受注一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: 新規受注の登録
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantity, dueDate } = body;

    // バリデーションチェック
    if (!itemId) {
      return NextResponse.json(
        { error: "商品を選択してください" },
        { status: 400 }
      );
    }
    if (!quantity || Number(quantity) <= 0) {
      return NextResponse.json(
        { error: "数量は1以上の数値を入力してください" },
        { status: 400 }
      );
    }
    if (!dueDate) {
      return NextResponse.json(
        { error: "納期を入力してください" },
        { status: 400 }
      );
    }

    // DBへ登録
    const newOrder = await prisma.order.create({
      data: {
        itemId,
        quantity: Number(quantity),
        dueDate: new Date(dueDate),
        status: "PENDING", // 初期状態は未引き当て
      },
      include: {
        item: true,
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "受注登録に失敗しました" },
      { status: 500 }
    );
  }
}