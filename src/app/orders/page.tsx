"use client";

import { useState, useEffect } from "react";

type Item = {
  id: string;
  name: string;
};

type Order = {
  id: string;
  quantity: number;
  dueDate: string;
  status: string;
  createdAt: string;
  item: Item;
};

export default function OrdersPage() {
  const [products, setProducts] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // フォームの状態
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [allocatingId, setAllocatingId] = useState<string | null>(null); // 引き当て処理中の注文ID

  // 初期データ取得
  const fetchData = async () => {
    try {
      const [resProducts, resOrders] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/orders"),
      ]);
      if (resProducts.ok) setProducts(await resProducts.json());
      if (resOrders.ok) setOrders(await resOrders.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 受注登録ハンドラー
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItemId,
          quantity,
          dueDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "登録に失敗しました");
      }

      // フォーム初期化＆一覧再取得
      setSelectedItemId("");
      setQuantity(1);
      setDueDate("");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 在庫引き当てハンドラー
  const handleAllocate = async (orderId: string) => {
    setError("");
    setAllocatingId(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}/allocate`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "引き当て処理に失敗しました");
      }

      const shortage = data.data.shortageQuantity;
      if (shortage > 0) {
        alert(`一部引き当てが完了しました。\n在庫が不足しています（不足数: ${shortage}個）。`);
      } else {
        alert("在庫の引き当てが正常に完了しました！");
      }

      // 最新状態へ更新
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAllocatingId(null);
    }
  };

  // ステータスバッジの見た目を返すヘルパー関数
  const renderStatusBadge = (status: string) => {
    let bg = "#e2e8f0";
    let color = "#475569";
    let text = "未引き当て";

    if (status === "PARTIAL") {
      bg = "#fef3c7";
      color = "#92400e";
      text = "一部引き当て (在庫不足)";
    } else if (status === "ALLOCATED") {
      bg = "#dcfce7";
      color = "#166534";
      text = "引き当て完了";
    }

    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: bg,
          color: color,
          fontSize: "0.85em",
          fontWeight: "bold",
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>受注管理 (Order Phase)</h1>

      {/* エラー表示 */}
      {error && (
        <p style={{ color: "red", backgroundColor: "#fee2e2", padding: "10px", borderRadius: "4px" }}>
          {error}
        </p>
      )}

      {/* 受注入力フォーム */}
      <section style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>新規受注の登録</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px" }}>対象製品:</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            >
              <option value="">製品を選択してください</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px" }}>数量:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px" }}>納期:</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {loading ? "登録中..." : "受注を登録する"}
          </button>
        </form>
      </section>

      {/* 受注一覧テーブル */}
      <section>
        <h2>受注一覧</h2>
        {orders.length === 0 ? (
          <p>受注データがまだありません。</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "8px" }}>製品名</th>
                <th style={{ padding: "8px" }}>数量</th>
                <th style={{ padding: "8px" }}>納期</th>
                <th style={{ padding: "8px" }}>ステータス</th>
                <th style={{ padding: "8px" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>{order.item.name}</td>
                  <td style={{ padding: "8px" }}>{order.quantity}</td>
                  <td style={{ padding: "8px" }}>
                    {new Date(order.dueDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "8px" }}>
                    {renderStatusBadge(order.status)}
                  </td>
                  <td style={{ padding: "8px" }}>
                    {order.status !== "ALLOCATED" ? (
                      <button
                        onClick={() => handleAllocate(order.id)}
                        disabled={allocatingId === order.id}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85em",
                        }}
                      >
                        {allocatingId === order.id ? "処理中..." : "在庫引き当て実行"}
                      </button>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.85em" }}>完了済</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}