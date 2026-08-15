export type OrderStatus = 'PENDING' | 'ALLOCATED' | 'PARTIAL' | 'SHIPPED';

export type Order = {
  id: string;
  itemId: string;
  quantity: number;
  dueDate: string;
  status: OrderStatus;
  createdAt: string;
  item: {
    id: string;
    name: string;
    isProduct: boolean;
  };
};