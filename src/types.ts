export interface User {
  id: string;
  telegram_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string;
  created_at: string;
  role?: 'user' | 'admin';
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  price: number;
  published: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  video_id: string;
  amount: number;
  payment_status: 'pending' | 'approved' | 'rejected';
  transaction_id: string;
  created_at: string;
  // Included in API responses
  video_title?: string;
  video_thumbnail?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface Settings {
  id: string;
  upi_id: string;
  qr_image: string;
  support_email: string;
  telegram_bot_username?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalVideos: number;
  totalPurchases: number;
  totalRevenue: number;
  pendingPayments: number;
  latestUsers: User[];
  latestPurchases: Purchase[];
  latestUploads: Video[];
}
