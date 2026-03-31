export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category_id: number;
  category_name?: string;
  image_url: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

export interface SiteSettings {
  title: string;
  description: string;
  favicon: string;
  og_image: string;
  primary_color: string;
  bg_color: string;
  marquee_text: string;
  footer_description: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  contact_phone: string;
  contact_email: string;
  header_icon: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface Venue {
  id: number;
  address: string;
  hours: string;
  map_url: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  items: string; // JSON string of CartItem[]
  status: 'pending' | 'completed' | 'cancelled';
  payment_method: 'COD' | 'Banking';
  created_at: string;
}
