export type ProductCategory = 'Milk Tea' | 'Fruit Tea' | 'Coffee' | 'Bakery' | 'Snacks';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type UserRole = 'customer' | 'admin';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
  stock: number;
  active: boolean;
  isPopular?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  active: boolean;
  expiryDate: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  options?: {
    sugar?: string;
    ice?: string;
    note?: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  points?: number;
  customerPhone?: string;
  customerAddress?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CartItem extends OrderItem {}
