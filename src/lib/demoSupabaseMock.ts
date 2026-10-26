import {
  MITHAQ_CATEGORIES,
  MITHAQ_PRODUCTS,
  MITHAQ_STORIES,
  MITHAQ_COUPONS,
  MITHAQ_STORE_SETTINGS,
  MITHAQ_APP_SETTINGS
} from './demoData';

// Local storage keys for sandbox persistence
const STORAGE_ORDERS_KEY = 'mithaq_demo_orders';
const STORAGE_PRODUCTS_KEY = 'mithaq_demo_products';
const STORAGE_STORE_SETTINGS_KEY = 'mithaq_demo_store_settings';
const STORAGE_CUSTOMERS_KEY = 'mithaq_demo_customers';

// In-browser real-time broadcast channel
const demoChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('mithaq_demo_realtime') 
  : null;

const listeners: { table: string; callback: (payload: any) => void }[] = [];

if (demoChannel) {
  demoChannel.onmessage = (event) => {
    const { table, eventType, record } = event.data || {};
    listeners.filter(l => l.table === '*' || l.table === table).forEach(l => {
      try {
        l.callback({ eventType, new: record, old: record });
      } catch (e) {
        console.error('Demo realtime listener error', e);
      }
    });
  };
}

export const broadcastDemoChange = (table: string, eventType: string, record: any) => {
  if (demoChannel) {
    try {
      demoChannel.postMessage({ table, eventType, record });
    } catch (e) {}
  }
  // Also dispatch locally in same window
  listeners.filter(l => l.table === '*' || l.table === table).forEach(l => {
    try {
      l.callback({ eventType, new: record, old: record });
    } catch (e) {}
  });
};

// Seed initial state
const getStoredProducts = () => {
  if (typeof window === 'undefined') return MITHAQ_PRODUCTS;
  try {
    const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return MITHAQ_PRODUCTS;
};

const saveStoredProducts = (products: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    broadcastDemoChange('products', 'UPDATE', products);
  } catch (e) {}
};

export const getStoredOrders = (): any[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [];
};

export const saveStoredOrders = (orders: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {}
};

// --- Mock Query Builder ---
class MockQueryBuilder {
  private table: string;
  private filters: ((item: any) => boolean)[] = [];
  private orderFn: ((a: any, b: any) => number) | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      if (item[column] === undefined && column.includes('.')) {
        const parts = column.split('.');
        let val = item;
        for (const p of parts) val = val ? val[p] : undefined;
        return val === value;
      }
      return item[column] === value;
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => Array.isArray(values) && values.includes(item[column]));
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((item) => item[column] >= value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((item) => item[column] > value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((item) => item[column] <= value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((item) => item[column] < value);
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  like(column: string, pattern: string) {
    const regex = new RegExp('^' + pattern.replace(/%/g, '.*') + '$', 'i');
    this.filters.push((item) => regex.test(String(item[column] || '')));
    return this;
  }

  ilike(column: string, pattern: string) {
    return this.like(column, pattern);
  }

  contains(column: string, value: any) {
    this.filters.push((item) => {
      const val = item[column];
      if (Array.isArray(val)) {
        return Array.isArray(value) ? value.every(v => val.includes(v)) : val.includes(value);
      }
      return false;
    });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    const asc = options.ascending ?? true;
    this.orderFn = (a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      return asc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    };
    return this;
  }

  limit(count: number) {
    const origThen = this.then.bind(this);
    this.then = (onfulfilled: any, onrejected: any) => {
      return origThen().then((res: any) => {
        if (Array.isArray(res.data)) {
          res.data = res.data.slice(0, count);
        }
        return onfulfilled ? onfulfilled(res) : res;
      }, onrejected);
    };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private getDataForTable(): any[] {
    switch (this.table) {
      case 'products':
        return [...getStoredProducts()];
      case 'categories':
        return [...MITHAQ_CATEGORIES];
      case 'stories':
        return [...MITHAQ_STORIES];
      case 'coupons':
        return [...MITHAQ_COUPONS];
      case 'orders':
        return [...getStoredOrders()];
      case 'store_settings': {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_STORE_SETTINGS_KEY) : null;
        const current = stored ? JSON.parse(stored) : MITHAQ_STORE_SETTINGS;
        return [
          { ...current, branch_name: 'الفرع الرئيسي' },
          { ...current, branch_name: 'فرع التحلية' }
        ];
      }
      case 'app_settings':
        return [MITHAQ_APP_SETTINGS];
      case 'loyalty_config':
        return [{ id: 1, is_enabled: true, earning_rate: 1, redemption_rate: 10, min_points_to_redeem: 5, max_redemption_percentage: 50 }];
      case 'customers': {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOMERS_KEY) : null;
        return stored ? JSON.parse(stored) : [
          { phone_number: '0501234567', full_name: 'عميل تجريبي (محمد)', points_balance: 150 }
        ];
      }
      case 'branch_credentials':
        return [
          { branch_name: 'الفرع الرئيسي', password: '1234' },
          { branch_name: 'فرع التحلية', password: '1234' },
          { branch_name: 'admin', password: '123' }
        ];
      case 'broadcast_notifications':
        return [];
      case 'theme_settings':
        return [MITHAQ_APP_SETTINGS];
      case 'option_groups': {
        const groups: any[] = [];
        MITHAQ_PRODUCTS.forEach(p => {
          if (p.option_groups) groups.push(...p.option_groups);
        });
        return groups;
      }
      case 'option_items': {
        const items: any[] = [];
        MITHAQ_PRODUCTS.forEach(p => {
          if (p.option_groups) {
            p.option_groups.forEach(g => {
              if (g.items) items.push(...g.items);
            });
          }
        });
        return items;
      }
      case 'cart_recovery_settings':
        return [{ is_enabled: false }];
      case 'spin_wheel_rewards':
        return [];
      default:
        return [];
    }
  }

  async execute(): Promise<{ data: any; error: any }> {
    let rows = this.getDataForTable();

    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    if (this.orderFn) {
      rows.sort(this.orderFn);
    }

    if (this.isSingle || this.isMaybeSingle) {
      const singleRow = rows[0] || null;
      if (this.isSingle && !singleRow) {
        return { data: null, error: { message: 'Row not found in demo sandbox', code: 'PGRST116' } };
      }
      return { data: singleRow, error: null };
    }

    return { data: rows, error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  // --- Mutations ---
  async insert(records: any | any[]) {
    const list = Array.isArray(records) ? records : [records];
    const created: any[] = [];

    if (this.table === 'orders') {
      const existing = getStoredOrders();
      for (const rec of list) {
        const demoId = rec.id || 'demo_ord_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const orderNumber = 100 + existing.length + 1;
        const newOrder = {
          ...rec,
          id: demoId,
          order_number: orderNumber,
          created_at: rec.created_at || new Date().toISOString(),
          status: rec.status || 'new'
        };
        existing.unshift(newOrder);
        created.push(newOrder);
        broadcastDemoChange('orders', 'INSERT', newOrder);
      }
      saveStoredOrders(existing);
    } else if (this.table === 'products') {
      const existing = getStoredProducts();
      for (const rec of list) {
        const newProd = { ...rec, id: rec.id || 'demo_p_' + Date.now() };
        existing.push(newProd);
        created.push(newProd);
        broadcastDemoChange('products', 'INSERT', newProd);
      }
      saveStoredProducts(existing);
    } else if (this.table === 'customers') {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOMERS_KEY) : null;
      const customers = stored ? JSON.parse(stored) : [];
      for (const rec of list) {
        customers.push(rec);
        created.push(rec);
      }
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
    }

    return {
      data: this.isSingle ? created[0] : created,
      error: null,
      select: () => ({
        single: async () => ({ data: created[0], error: null }),
        then: (fn: any) => Promise.resolve({ data: created, error: null }).then(fn)
      })
    };
  }

  async update(payload: any) {
    let affectedRows: any[] = [];

    if (this.table === 'orders') {
      const existing = getStoredOrders();
      const updated = existing.map((ord: any) => {
        let matches = true;
        for (const f of this.filters) {
          if (!f(ord)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const newOrd = { ...ord, ...payload };
          affectedRows.push(newOrd);
          broadcastDemoChange('orders', 'UPDATE', newOrd);
          return newOrd;
        }
        return ord;
      });
      saveStoredOrders(updated);
    } else if (this.table === 'products') {
      const existing = getStoredProducts();
      const updated = existing.map((prod: any) => {
        let matches = true;
        for (const f of this.filters) {
          if (!f(prod)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const newProd = { ...prod, ...payload };
          affectedRows.push(newProd);
          broadcastDemoChange('products', 'UPDATE', newProd);
          return newProd;
        }
        return prod;
      });
      saveStoredProducts(updated);
    } else if (this.table === 'store_settings') {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_STORE_SETTINGS_KEY);
        const curr = stored ? JSON.parse(stored) : MITHAQ_STORE_SETTINGS;
        const next = { ...curr, ...payload };
        localStorage.setItem(STORAGE_STORE_SETTINGS_KEY, JSON.stringify(next));
        broadcastDemoChange('store_settings', 'UPDATE', next);
      }
    }

    return { data: affectedRows, error: null };
  }

  async upsert(records: any | any[], _opts?: any) {
    const list = Array.isArray(records) ? records : [records];
    if (this.table === 'store_settings' && list[0]) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_STORE_SETTINGS_KEY);
        const curr = stored ? JSON.parse(stored) : MITHAQ_STORE_SETTINGS;
        const next = { ...curr, ...list[0] };
        localStorage.setItem(STORAGE_STORE_SETTINGS_KEY, JSON.stringify(next));
        broadcastDemoChange('store_settings', 'UPDATE', next);
      }
    }
    return { data: list, error: null };
  }

  async delete() {
    if (this.table === 'orders') {
      const existing = getStoredOrders();
      const filtered = existing.filter((ord: any) => {
        for (const f of this.filters) {
          if (f(ord)) return false;
        }
        return true;
      });
      saveStoredOrders(filtered);
    } else if (this.table === 'products') {
      const existing = getStoredProducts();
      const filtered = existing.filter((prod: any) => {
        for (const f of this.filters) {
          if (f(prod)) return false;
        }
        return true;
      });
      saveStoredProducts(filtered);
    }
    return { data: null, error: null };
  }
}

// --- The Mock Supabase Client Object ---
export const demoSupabaseClient: any = {
  from: (table: string) => new MockQueryBuilder(table),

  channel: (channelName: string) => {
    const channelListeners: Array<{ table: string; callback: any }> = [];

    const channelObj: any = {
      name: channelName,
      state: 'joined',
      topic: channelName,
      on: (_eventStr: string, filterObj: any, callback: (payload: any) => void) => {
        const table = filterObj?.table || '*';
        const entry = { table, callback };
        listeners.push(entry);
        channelListeners.push(entry);
        return channelObj;
      },
      subscribe: (statusCallback?: (status: string) => void) => {
        if (statusCallback) {
          try {
            statusCallback('SUBSCRIBED');
          } catch (e) {
            console.error('Demo realtime statusCallback error:', e);
          }
        }
        return channelObj;
      },
      unsubscribe: async () => {
        channelListeners.forEach(entry => {
          const idx = listeners.indexOf(entry);
          if (idx !== -1) listeners.splice(idx, 1);
        });
        return 'ok';
      }
    };

    return channelObj;
  },

  removeChannel: async (channelOrName?: any) => {
    if (channelOrName && typeof channelOrName.unsubscribe === 'function') {
      try {
        await channelOrName.unsubscribe();
      } catch (e) {
        // ignore
      }
    }
    return 'ok';
  },

  removeAllChannels: async () => {
    listeners.length = 0;
    return 'ok';
  },

  getChannels: () => [],

  storage: {
    from: (_bucket: string) => ({
      getPublicUrl: (path: string) => ({
        data: { publicUrl: path?.startsWith('http') ? path : '/assets/logo.png' }
      }),
      upload: async (_path: string, _file: any) => ({
        data: { path: _path },
        error: null
      })
    })
  },

  rpc: async (_fnName: string, _args: any) => {
    return { data: null, error: null };
  }
};
