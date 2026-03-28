export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  image_url: string;
  is_available: boolean;
  calories?: number;
  starting_price?: number;
}

export interface OptionGroup {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  min_selection: number;
  max_selection: number;
}

export interface OptionItem {
  id: string;
  group_id: string;
  name_ar: string;
  name_en: string;
  price: number;
  is_available: boolean;
}

export interface Ingredient {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  is_removable: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  max_uses?: number | null;
  current_uses: number;
  expires_at?: string | null;
}

export interface CartItem {
  id: string; // unique id for cart entry
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options: {
    groupId: string;
    groupName: string;
    itemId: string;
    itemName: string;
    price: number;
  }[];
  removedIngredients: string[];
  totalPrice: number;
  notes?: string;
}

export type OrderType = 'pickup' | 'delivery';
export type Branch = 'السويدي الغربي' | 'طويق';

export interface Order {
  id?: string;
  branch: Branch;
  order_type: OrderType;
  customer_name: string;
  phone: string;
  location?: string;
  notes?: string;
  total_price: number;
  items: CartItem[];
  status: 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface StoreSettings {
  branch_name: string;
  status: 'open' | 'busy' | 'closed';
  is_delivery_active: boolean;
  is_pickup_active: boolean;
}
