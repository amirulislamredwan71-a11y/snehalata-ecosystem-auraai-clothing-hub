export type VendorStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'BLOCKED';

export type VideoJobStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'QUALITY_CHECK' | 'SHIPPED' | 'DELIVERED';

export interface TimelineEntry {
  status: OrderStatus;
  label: string;
  timestamp: string;
  completed: boolean;
  description: string;
}

export interface Product {
  id: number;
  vendorId: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  externalUrl?: string;
  category: string;
}

export interface Vendor {
  id: number;
  store_name: string;
  owner_name: string;
  slug: string;
  website_url?: string;
  status: VendorStatus;
  description: string;
  tradeLicense?: string;
  category_id?: number;
  district: string;
  area?: string;
}

export interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  items: Product[];
  currentStatus: OrderStatus;
  estimatedDelivery: string;
  timeline: TimelineEntry[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

export interface EcosystemStats {
  totalVendors: number;
  activeProducts: number;
  monthlyVolume: number;
  aiInteractions: number;
  trendForecast: Array<{ year: string; trend: string; growth: number }>;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'aura';
  image?: string;
}
