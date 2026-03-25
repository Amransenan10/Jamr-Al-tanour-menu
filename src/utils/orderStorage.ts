export interface StoredOrder {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items_count: number;
}

const STORAGE_KEY = 'jamr_recent_orders';

export const saveOrderLocally = (order: StoredOrder) => {
  const existingOrders = getStoredOrders();
  // Check if order already exists to prevent duplicates
  if (!existingOrders.find((o) => o.id === order.id)) {
    const updatedOrders = [order, ...existingOrders];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  }
};

export const getStoredOrders = (): StoredOrder[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading orders from localStorage', error);
  }
  return [];
};

export const updateStoredOrderStatus = (orderId: string, status: string) => {
  const orders = getStoredOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }
};

// Returns the most recent order that is not completed or cancelled, if any
export const getActiveOrder = (): StoredOrder | null => {
  const orders = getStoredOrders();
  const activeStatuses = ['new', 'accepted', 'preparing', 'ready'];
  return orders.find((o) => activeStatuses.includes(o.status.toLowerCase())) || null;
};
