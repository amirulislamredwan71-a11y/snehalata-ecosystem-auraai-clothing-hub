export type UserRole = 'ADMIN' | 'VENDOR' | 'CUSTOMER';

export type VendorStatus = 'PENDING' | 'APPROVED' | 'BLOCKED';

export interface Category {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface Vendor {
  id: string | number;
  name?: string; // Fallback for components requesting name
  store_name: string; // matches store_name in SQL
  owner_name: string;
  email?: string;
  status: string; // matches status in SQL (pending, approved, blocked)
  created_at?: string;
  website_url?: string; // external website
  category_id?: string | number; // primary category
  slug?: string;
  description?: string;
  district?: string;
  area?: string;
}

export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock_quantity?: number;
  image_url?: string; // matches image_url in SQL
  imageUrl?: string; // matches imageUrl in mockData
  externalUrl?: string;
  created_at?: string;
  vendorId?: string | number; // For relationship mapping
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  generatedImageUrl?: string;
  imagePrompt?: string; // Store the prompt used to generate the image
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'QUALITY_CHECK' | 'SHIPPED' | 'DELIVERED';

export interface OrderTimeline {
  status: OrderStatus;
  label: string;
  timestamp: string;
  completed: boolean;
  description: string;
}

export interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  items: Product[];
  currentStatus: OrderStatus;
  estimatedDelivery: string;
  timeline: OrderTimeline[];
}

export interface EcosystemStats {
    totalVendors: number;
    activeProducts: number;
    monthlyVolume: number;
    aiInteractions: number;
    trendForecast: {
        year: string;
        trend: string;
        growth: number;
    }[];
}

export type AuditStatus = 'PASSED' | 'WARNING' | 'FAILED' | 'RE-AUDITING';

export interface AuditEntry {
  id: string;
  type: 'IMAGE_QUALITY' | 'PRICING_ETHICS' | 'AUTHENTICITY' | 'COPYWRITING' | 'LEGAL_COMPLIANCE' | 'SUSTAINABILITY';
  status: AuditStatus;
  timestamp: string;
  label: string;
  details: string;
}