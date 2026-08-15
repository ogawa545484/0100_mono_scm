import React from 'react';

type Props = {
  status: string;
};

export function OrderStatusBadge({ status }: Props) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="px-2 py-1 text-xs font-bold text-gray-700 bg-gray-200 rounded-full">
          未引き当て
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="px-2 py-1 text-xs font-bold text-yellow-800 bg-yellow-100 rounded-full">
          一部引き当て（在庫不足）
        </span>
      );
    case 'ALLOCATED':
      return (
        <span className="px-2 py-1 text-xs font-bold text-green-800 bg-green-100 rounded-full">
          引き当て完了
        </span>
      );
    default:
      return <span className="text-xs text-gray-500">{status}</span>;
  }
}