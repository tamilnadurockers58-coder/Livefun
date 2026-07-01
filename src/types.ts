export interface User {
  id: string;
  email?: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image: string;
  created_at: string;
  role?: 'user' | 'admin' | 'host';
  host_status?: 'pending' | 'approved' | 'rejected' | null;
  telegram_id?: string;
  live_thumbnail?: string;
  is_live?: boolean;
  earnings?: number;
  followers?: number;
  bio?: string;
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

export interface HostApplication {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  gender: string;
  telegram_username?: string;
  email: string;
  experience: string;
  why_host: string;
  profile_photo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Included join data
  username?: string;
  profile_image?: string;
}

export interface HostChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  host_id: string;
  message_text?: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file' | null;
  attachment_name?: string;
  is_read: boolean;
  created_at: string;
}

export interface HostFollower {
  id: string;
  host_id: string;
  user_id: string;
  username: string;
  profile_image: string;
  is_muted: boolean;
  is_banned: boolean;
  followed_at: string;
}

export interface HostEarningsLog {
  id: string;
  host_id: string;
  amount: number;
  source: 'stream_tip' | 'video_purchase' | 'subscription';
  description: string;
  created_at: string;
  username?: string;
}

export interface WithdrawalRequest {
  id: string;
  host_id: string;
  amount: number;
  payout_method: string;
  payout_details: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

