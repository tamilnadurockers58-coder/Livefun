import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { 
  User, Video, Purchase, Settings, DashboardStats, HostApplication, HostChatMessage,
  HostFollower, HostEarningsLog, WithdrawalRequest 
} from '../src/types';

const isProduction = process.env.NODE_ENV === 'production';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Enable Supabase if keys exist
export const useSupabase = !!(supabaseUrl && supabaseKey);

console.log(useSupabase 
  ? '⚡ Database: Using Supabase Cloud PostgreSQL.' 
  : '💾 Database: Using local JSON database (db.json) fallback.'
);

// Supabase client instance (or null)
const supabase = useSupabase ? createClient(supabaseUrl, supabaseKey) : null;

// JSON File Database Fallback path
const JSON_DB_PATH = path.join(process.cwd(), 'db.json');

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Sample / Initial Seed Data
const DEFAULT_SETTINGS: Settings = {
  id: 'global',
  upi_id: 'm.k8738@pthdfc',
  qr_image: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400&auto=format&fit=crop&q=60', // Mock QR image
  support_email: '@MeeCustomerservice',
  telegram_bot_username: 'PremiumStreamBot'
};

const DEFAULT_VIDEOS: Video[] = [
  {
    id: 'vid-1',
    title: 'Telegram Premium Features & Channel Monetization Guide',
    description: 'Learn how to maximize your reach and unlock advanced features on Telegram. This premium tutorial covers channel creation, bot automation, and monetization secrets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=800&auto=format&fit=crop&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    price: 299,
    published: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'vid-2',
    title: 'Building High-Performance Web Apps with React 19 & Tailwind v4',
    description: 'A completely free masterclass covering the new features of React 19, including actions, use(), server components, and styling with Tailwind CSS v4.',
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    price: 0,
    published: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'vid-3',
    title: 'Advanced Server-Authoritative Video Streaming Architectures',
    description: 'Unlock exclusive backend strategies to build highly optimized, secure, and resilient video delivery systems. Ideal for engineers and streaming startup founders.',
    thumbnail_url: 'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=800&auto=format&fit=crop&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    price: 499,
    published: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-maxwell',
    email: 'maxwellblackey@gmail.com',
    username: 'maxwell',
    first_name: 'Maxwell',
    last_name: 'Blackey',
    profile_image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=maxwell',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    role: 'admin',
    password: 'Muneeswari1@'
  } as any,
  {
    id: 'user-1',
    telegram_id: '123456789',
    username: 'durov',
    first_name: 'Pavel',
    last_name: 'Durov',
    profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user-2',
    telegram_id: '987654321',
    username: 'tele_star',
    first_name: 'Alex',
    last_name: 'Premium',
    profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    user_id: 'user-2',
    video_id: 'vid-1',
    amount: 299,
    payment_status: 'approved',
    transaction_id: 'TXN1002938475',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'pur-2',
    user_id: 'user-1',
    video_id: 'vid-3',
    amount: 499,
    payment_status: 'pending',
    transaction_id: 'TXN2093840192',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

interface JsonDbSchema {
  users: User[];
  videos: Video[];
  purchases: Purchase[];
  settings: Settings;
  host_applications: HostApplication[];
  host_chats: HostChatMessage[];
  host_followers?: HostFollower[];
  host_earnings_logs?: HostEarningsLog[];
  withdrawal_requests?: WithdrawalRequest[];
}

// Read JSON database file
function readJsonDb(): JsonDbSchema {
  try {
    let db: any;
    if (!fs.existsSync(JSON_DB_PATH)) {
      db = {
        users: DEFAULT_USERS,
        videos: DEFAULT_VIDEOS,
        purchases: DEFAULT_PURCHASES,
        settings: DEFAULT_SETTINGS,
        host_applications: [],
        host_chats: [],
        host_followers: [],
        host_earnings_logs: [],
        withdrawal_requests: []
      };
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else {
      const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
      db = JSON.parse(data);
    }
    
    if (!db.host_applications) db.host_applications = [];
    if (!db.host_chats) db.host_chats = [];
    if (!db.host_followers) db.host_followers = [];
    if (!db.host_earnings_logs) db.host_earnings_logs = [];
    if (!db.withdrawal_requests) db.withdrawal_requests = [];
    
    // Auto-ensure maxwellblackey exists with role admin
    const adminExistsIndex = db.users.findIndex((u: any) => u.email === 'maxwellblackey@gmail.com');
    if (adminExistsIndex === -1) {
      db.users.push({
        id: 'admin-maxwell',
        email: 'maxwellblackey@gmail.com',
        username: 'maxwell',
        first_name: 'Maxwell',
        last_name: 'Blackey',
        profile_image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=maxwell',
        created_at: new Date().toISOString(),
        role: 'admin',
        password: 'Muneeswari1@'
      } as any);
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } else {
      // update credentials and role in case it was modified
      db.users[adminExistsIndex].role = 'admin';
      db.users[adminExistsIndex].password = 'Muneeswari1@';
    }
    
    return db;
  } catch (err) {
    console.error('Error reading JSON DB, using defaults', err);
    return {
      users: DEFAULT_USERS,
      videos: DEFAULT_VIDEOS,
      purchases: DEFAULT_PURCHASES,
      settings: DEFAULT_SETTINGS,
      host_applications: [],
      host_chats: [],
      host_followers: [],
      host_earnings_logs: [],
      withdrawal_requests: []
    };
  }
}

// Write JSON database file
function writeJsonDb(data: JsonDbSchema) {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing JSON DB', err);
  }
}

// ============================================
// DATABASE OPERATIONS EXPORTS
// ============================================

// --- SETTINGS OPERATIONS ---
export async function getSettings(): Promise<Settings> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
    if (error || !data) {
      // Create if it doesn't exist
      const { data: inserted, error: insertErr } = await supabase
        .from('settings')
        .upsert(DEFAULT_SETTINGS)
        .select()
        .single();
      return inserted || DEFAULT_SETTINGS;
    }
    return data;
  } else {
    const db = readJsonDb();
    return db.settings;
  }
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 'global', ...settings })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readJsonDb();
    db.settings = { ...db.settings, ...settings };
    writeJsonDb(db);
    return db.settings;
  }
}

// --- USER OPERATIONS ---
export async function getUsers(): Promise<User[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) {
        // Fallback to users table
        const { data: uData, error: uError } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (uError) throw uError;
        return (uData || []).map((u: any) => ({
          id: u.id,
          email: u.email || '',
          username: u.username || '',
          first_name: u.first_name || u.username || '',
          last_name: u.last_name || '',
          profile_image: u.profile_image || u.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          created_at: u.created_at,
          role: u.role || 'user'
        }));
      }
      return (data || []).map((p: any) => ({
        id: p.id,
        email: p.email || '',
        username: p.full_name || p.email?.split('@')[0] || '',
        first_name: p.full_name || '',
        last_name: '',
        profile_image: p.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.id}`,
        created_at: p.created_at,
        role: p.role || 'user',
        host_status: p.host_status || null
      }));
    } catch (err) {
      console.error('Supabase get users error, falling back:', err);
      return [];
    }
  } else {
    const db = readJsonDb();
    return db.users
      .map(u => ({ 
        id: u.id,
        email: (u as any).email || '',
        username: u.username || '',
        first_name: u.first_name || u.username || '',
        last_name: u.last_name || '',
        profile_image: u.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        created_at: u.created_at,
        role: u.role || 'user'
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getUserById(id: string): Promise<User | null> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        // Fallback to users
        const { data: uData, error: uError } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
        if (uError || !uData) return null;
        return {
          id: uData.id,
          email: uData.email || '',
          username: uData.username || '',
          first_name: uData.first_name || uData.username || '',
          last_name: uData.last_name || '',
          profile_image: uData.profile_image || uData.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          created_at: uData.created_at,
          role: uData.role || 'user'
        };
      }
      return {
        id: data.id,
        email: data.email || '',
        username: data.full_name || data.email?.split('@')[0] || '',
        first_name: data.full_name || '',
        last_name: '',
        profile_image: data.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.id}`,
        created_at: data.created_at,
        role: data.role || 'user',
        host_status: data.host_status || null
      };
    } catch (err) {
      console.error('Supabase getUserById error:', err);
      return null;
    }
  } else {
    const db = readJsonDb();
    const user = db.users.find(u => u.id === id);
    if (!user) return null;
    return {
      id: user.id,
      email: (user as any).email || '',
      username: user.username || '',
      first_name: user.first_name || user.username || '',
      last_name: user.last_name || '',
      profile_image: user.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      created_at: user.created_at,
      role: user.role || 'user'
    };
  }
}

export async function createOrUpdateProfile(userData: {
  id: string;
  email: string;
  username: string;
  profile_image?: string;
  role?: 'user' | 'admin' | 'host';
}): Promise<User> {
  const profileImage = userData.profile_image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.username}`;
  const defaultRole = userData.role || 'user';

  if (useSupabase && supabase) {
    const record = {
      id: userData.id,
      email: userData.email,
      full_name: userData.username,
      avatar_url: profileImage,
      role: defaultRole
    };

    try {
      // Upsert to profiles
      const { data, error } = await supabase
        .from('profiles')
        .upsert(record)
        .select()
        .single();
      
      if (error) {
        // Fallback upsert to users
        const legacyRecord = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          first_name: userData.username,
          profile_image: profileImage,
          photo_url: profileImage,
          role: defaultRole
        };
        const { data: uData, error: uError } = await supabase
          .from('users')
          .upsert(legacyRecord)
          .select()
          .single();
        if (uError) throw uError;
        return {
          id: uData.id,
          email: uData.email || userData.email,
          username: uData.username || userData.username,
          first_name: uData.first_name || uData.username || '',
          last_name: uData.last_name || '',
          profile_image: uData.profile_image || uData.photo_url || profileImage,
          created_at: uData.created_at || new Date().toISOString(),
          role: uData.role || defaultRole
        };
      }
      return {
        id: data.id,
        email: data.email || userData.email,
        username: data.full_name || userData.username,
        first_name: data.full_name || '',
        last_name: '',
        profile_image: data.avatar_url || profileImage,
        created_at: data.created_at || new Date().toISOString(),
        role: data.role || defaultRole,
        host_status: data.host_status || null
      };
    } catch (err: any) {
      console.error('Supabase profile upsert error, attempting non-returning upsert:', err);
      // Fallback queryless upsert
      await supabase.from('profiles').upsert(record);
      return {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        first_name: userData.username,
        last_name: '',
        profile_image: profileImage,
        created_at: new Date().toISOString(),
        role: defaultRole
      };
    }
  } else {
    const db = readJsonDb();
    const existingIndex = db.users.findIndex(u => u.id === userData.id || (u as any).email === userData.email);
    if (existingIndex >= 0) {
      db.users[existingIndex] = {
        ...db.users[existingIndex],
        email: userData.email,
        username: userData.username,
        first_name: userData.username,
        profile_image: profileImage,
        role: defaultRole
      } as any;
      writeJsonDb(db);
      return db.users[existingIndex];
    } else {
      const newUser: User = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        first_name: userData.username,
        last_name: '',
        profile_image: profileImage,
        created_at: new Date().toISOString(),
        role: defaultRole
      } as any;
      db.users.push(newUser);
      writeJsonDb(db);
      return newUser;
    }
  }
}

export async function localSignUp(userData: {
  email: string;
  password?: string;
  username: string;
}): Promise<User> {
  const db = readJsonDb();
  const existing = db.users.find(u => (u as any).email === userData.email);
  if (existing) {
    throw new Error('User with this email already exists.');
  }

  const role = 'user';
  const newUser: User = {
    id: 'usr-' + generateId(),
    email: userData.email,
    password: userData.password || 'password123',
    username: userData.username,
    first_name: userData.username,
    last_name: '',
    profile_image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.username}`,
    created_at: new Date().toISOString(),
    role: role
  } as any;

  db.users.push(newUser);
  writeJsonDb(db);
  return newUser;
}

export async function localLogin(userData: {
  email: string;
  password?: string;
}): Promise<User> {
  const db = readJsonDb();
  const user = db.users.find(u => (u as any).email === userData.email) as any;
  if (!user) {
    throw new Error('No account found with this email.');
  }
  if (userData.password && user.password !== userData.password) {
    throw new Error('Incorrect password.');
  }
  return user;
}

export async function updateUserProfileImage(userId: string, imageUrl: string): Promise<User> {
  if (useSupabase && supabase) {
    try {
      // Try updating profiles first
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        // Fallback to users
        const { data: uData, error: uError } = await supabase
          .from('users')
          .update({ profile_image: imageUrl, photo_url: imageUrl })
          .eq('id', userId)
          .select()
          .single();
        if (uError) throw uError;
        return {
          id: uData.id,
          email: uData.email || '',
          username: uData.username || '',
          first_name: uData.first_name || uData.username || '',
          last_name: uData.last_name || '',
          profile_image: uData.profile_image || uData.photo_url || imageUrl,
          created_at: uData.created_at,
          role: uData.role || 'user'
        };
      }
      return {
        id: data.id,
        email: data.email || '',
        username: data.full_name || data.email?.split('@')[0] || 'User',
        first_name: data.full_name || '',
        last_name: '',
        profile_image: data.avatar_url || imageUrl,
        created_at: data.created_at,
        role: data.role || 'user'
      };
    } catch (err) {
      console.error('Supabase update profile image error:', err);
      return {
        id: userId,
        email: '',
        username: 'User',
        profile_image: imageUrl,
        created_at: new Date().toISOString(),
        role: 'user'
      };
    }
  } else {
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    db.users[userIndex].profile_image = imageUrl;
    writeJsonDb(db);
    return db.users[userIndex];
  }
}

// --- VIDEO OPERATIONS ---
export async function getVideos(includeUnpublished = false): Promise<Video[]> {
  if (useSupabase && supabase) {
    let query = supabase.from('videos').select('*');
    if (!includeUnpublished) {
      query = query.eq('published', true);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    const db = readJsonDb();
    let videos = db.videos;
    if (!includeUnpublished) {
      videos = videos.filter(v => v.published);
    }
    return videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getVideoById(id: string): Promise<Video | null> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.from('videos').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data;
  } else {
    const db = readJsonDb();
    return db.videos.find(v => v.id === id) || null;
  }
}

export async function createVideo(videoData: Omit<Video, 'id' | 'created_at'>): Promise<Video> {
  if (useSupabase && supabase) {
    const { id, ...restVideoData } = videoData as any;
    const newVideo = {
      ...restVideoData,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('videos').insert(newVideo).select().single();
    if (error) throw error;
    return data;
  } else {
    const db = readJsonDb();
    const newVideo: Video = {
      id: 'vid-' + generateId(),
      ...videoData,
      created_at: new Date().toISOString()
    };
    db.videos.push(newVideo);
    writeJsonDb(db);
    return newVideo;
  }
}

export async function updateVideo(id: string, videoData: Partial<Video>): Promise<Video> {
  if (useSupabase && supabase) {
    const { id: _, created_at: __, ...updates } = videoData as any;
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readJsonDb();
    const videoIndex = db.videos.findIndex(v => v.id === id);
    if (videoIndex === -1) throw new Error('Video not found');
    db.videos[videoIndex] = { ...db.videos[videoIndex], ...videoData };
    writeJsonDb(db);
    return db.videos[videoIndex];
  }
}

export async function deleteVideo(id: string): Promise<boolean> {
  if (useSupabase && supabase) {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) throw error;
    return true;
  } else {
    const db = readJsonDb();
    const originalLength = db.videos.length;
    db.videos = db.videos.filter(v => v.id !== id);
    // Also clear purchases associated with deleted video
    db.purchases = db.purchases.filter(p => p.video_id !== id);
    writeJsonDb(db);
    return db.videos.length < originalLength;
  }
}

// --- PURCHASE OPERATIONS ---
export async function getPurchases(): Promise<Purchase[]> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        videos:video_id (title, thumbnail_url),
        users:user_id (username, first_name, last_name)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Map response matching our Purchase definition with nested details
    return (data || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      video_id: p.video_id,
      amount: p.amount,
      payment_status: p.payment_status,
      transaction_id: p.transaction_id,
      created_at: p.created_at,
      video_title: p.videos?.title,
      video_thumbnail: p.videos?.thumbnail_url,
      username: p.users?.username,
      first_name: p.users?.first_name,
      last_name: p.users?.last_name
    }));
  } else {
    const db = readJsonDb();
    return db.purchases.map(p => {
      const user = db.users.find(u => u.id === p.user_id);
      const video = db.videos.find(v => v.id === p.video_id);
      return {
        ...p,
        video_title: video?.title || 'Unknown Video',
        video_thumbnail: video?.thumbnail_url || '',
        username: user?.username || 'unknown',
        first_name: user?.first_name || 'Deleted',
        last_name: user?.last_name || 'User'
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  const all = await getPurchases();
  return all.filter(p => p.user_id === userId);
}

export async function createPurchase(purchaseData: Omit<Purchase, 'id' | 'payment_status' | 'created_at'>): Promise<Purchase> {
  if (useSupabase && supabase) {
    const { id: _, ...restPurchaseData } = purchaseData as any;
    
    const newPurchase = {
      ...restPurchaseData,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('purchases').insert(newPurchase).select().single();
    if (error) throw error;
    return data;
  } else {
    const db = readJsonDb();
    const newPurchase: Purchase = {
      id: 'pur-' + generateId(),
      ...purchaseData,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
    db.purchases.push(newPurchase);
    writeJsonDb(db);
    
    // Supplement data to return matching format
    const user = db.users.find(u => u.id === newPurchase.user_id);
    const video = db.videos.find(v => v.id === newPurchase.video_id);
    return {
      ...newPurchase,
      video_title: video?.title || '',
      video_thumbnail: video?.thumbnail_url || '',
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || ''
    };
  }
}

export async function updatePurchaseStatus(id: string, status: 'approved' | 'rejected'): Promise<Purchase> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from('purchases')
      .update({ payment_status: status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readJsonDb();
    const purchaseIndex = db.purchases.findIndex(p => p.id === id);
    if (purchaseIndex === -1) throw new Error('Purchase not found');
    db.purchases[purchaseIndex].payment_status = status;
    writeJsonDb(db);
    
    const p = db.purchases[purchaseIndex];
    const user = db.users.find(u => u.id === p.user_id);
    const video = db.videos.find(v => v.id === p.video_id);
    return {
      ...p,
      video_title: video?.title || '',
      video_thumbnail: video?.thumbnail_url || '',
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || ''
    };
  }
}

// Check if a user has access to a video (returns true if free or approved purchase exists)
export async function checkVideoAccess(userId: string | null, videoId: string): Promise<boolean> {
  const video = await getVideoById(videoId);
  if (!video) return false;
  if (video.price <= 0) return true;
  if (!userId) return false;

  const purchases = await getUserPurchases(userId);
  const activePurchase = purchases.find(p => p.video_id === videoId && p.payment_status === 'approved');
  return !!activePurchase;
}

// --- DASHBOARD STATISTICS OPERATIONS ---
export async function getDashboardStats(): Promise<DashboardStats> {
  const users = await getUsers();
  const videos = await getVideos(true); // include unpublished
  const purchases = await getPurchases();

  const totalUsers = users.length;
  const totalVideos = videos.length;
  const totalPurchases = purchases.filter(p => p.payment_status === 'approved').length;
  const totalRevenue = purchases
    .filter(p => p.payment_status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = purchases.filter(p => p.payment_status === 'pending').length;

  return {
    totalUsers,
    totalVideos,
    totalPurchases,
    totalRevenue,
    pendingPayments,
    latestUsers: users.slice(0, 5),
    latestPurchases: purchases.slice(0, 5),
    latestUploads: videos.slice(0, 5)
  };
}

// --- HOST OPERATIONS ---
export async function getHostApplications(): Promise<HostApplication[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('host_requests')
        .select('*, profiles:user_id(*)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((req: any) => ({
          id: req.id,
          user_id: req.user_id,
          status: req.status,
          created_at: req.created_at,
          full_name: req.profiles?.full_name || 'Applicant',
          email: req.profiles?.email || '',
          profile_photo_url: req.profiles?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Applicant',
          username: req.profiles?.full_name || req.profiles?.email?.split('@')[0] || 'Applicant',
          profile_image: req.profiles?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Applicant',
          age: 25,
          gender: 'Male',
          experience: 'Experienced livestreamer and content creator.',
          why_host: 'To host premium live streaming content.',
          telegram_username: req.profiles?.email?.split('@')[0] || 'host_tele'
        }));
      } else if (error) {
        console.error('Supabase host_requests select error:', error);
      }
    } catch (err) {
      console.warn('Supabase host_requests select error, falling back:', err);
    }
  }
  const db = readJsonDb();
  return db.host_applications.map(app => {
    const u = db.users.find(user => user.id === app.user_id);
    return {
      ...app,
      username: u?.username || '',
      profile_image: u?.profile_image || ''
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function submitHostApplication(appData: Omit<HostApplication, 'id' | 'status' | 'created_at'>): Promise<HostApplication> {
  const newApp: HostApplication = {
    id: 'app-' + generateId(),
    ...appData,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  if (useSupabase && supabase) {
    try {
      // Set host_status on public.profiles to 'pending'
      await supabase
        .from('profiles')
        .update({
          host_status: 'pending',
          full_name: appData.full_name,
          avatar_url: appData.profile_photo_url
        })
        .eq('id', appData.user_id);

      const { data, error } = await supabase
        .from('host_requests')
        .insert({
          user_id: appData.user_id,
          status: 'pending'
        })
        .select()
        .single();
      if (!error && data) {
        return {
          ...newApp,
          id: data.id,
          status: data.status,
          created_at: data.created_at
        };
      } else if (error) {
        console.error('Supabase host_requests insert error:', error);
      }
    } catch (err) {
      console.warn('Supabase host_requests insert error, falling back:', err);
    }
  }

  const db = readJsonDb();
  db.host_applications.push(newApp);
  writeJsonDb(db);
  return newApp;
}

export async function updateHostApplicationStatus(id: string, status: 'approved' | 'rejected'): Promise<HostApplication> {
  let updatedApp: HostApplication | null = null;

  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('host_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const userId = data.user_id;
        const role = status === 'approved' ? 'host' : 'user';

        // Update public.profiles role & host_status
        await supabase
          .from('profiles')
          .update({
            role: role,
            host_status: status
          })
          .eq('id', userId);

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        updatedApp = {
          id: data.id,
          user_id: data.user_id,
          status: data.status,
          created_at: data.created_at,
          full_name: prof?.full_name || 'Host Member',
          email: prof?.email || '',
          profile_photo_url: prof?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=host',
          username: prof?.full_name || prof?.email?.split('@')[0] || 'host',
          profile_image: prof?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=host',
          age: 25,
          gender: 'Male',
          experience: 'Approved Premium Host.',
          why_host: 'To host premium contents.',
          telegram_username: prof?.email?.split('@')[0] || 'host_tele'
        };
      } else if (error) {
        console.error('Supabase host_requests update status error:', error);
      }
    } catch (err) {
      console.warn('Supabase host_requests status update error, falling back:', err);
    }
  }

  const db = readJsonDb();
  const index = db.host_applications.findIndex(app => app.id === id);
  if (index !== -1) {
    db.host_applications[index].status = status;
    updatedApp = db.host_applications[index];
    if (status === 'approved') {
      const uIndex = db.users.findIndex(u => u.id === updatedApp?.user_id);
      if (uIndex !== -1) {
        db.users[uIndex].role = 'host';
        db.users[uIndex].earnings = 0;
        db.users[uIndex].followers = 0;
      }
    }
    writeJsonDb(db);
  }

  if (!updatedApp) throw new Error('Host Application not found');
  return updatedApp;
}

export async function deleteHostApplication(id: string): Promise<boolean> {
  if (useSupabase && supabase) {
    try {
      const { error } = await supabase.from('host_requests').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase host_requests delete error, falling back:', err);
    }
  }

  const db = readJsonDb();
  const index = db.host_applications.findIndex(app => app.id === id);
  if (index !== -1) {
    db.host_applications.splice(index, 1);
    writeJsonDb(db);
    return true;
  }
  return false;
}

export async function getHostChatMessages(hostId: string): Promise<HostChatMessage[]> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('host_messages')
        .select('*')
        .or(`sender_id.eq.${hostId},receiver_id.eq.${hostId}`)
        .order('created_at', { ascending: true });
      if (!error && data) {
        return data.map((m: any) => ({
          id: String(m.id),
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          host_id: hostId,
          message_text: m.message || '',
          is_read: false,
          created_at: m.created_at || new Date().toISOString()
        }));
      } else if (error) {
        console.error('Supabase host_messages select error:', error);
      }
    } catch (err) {
      console.warn('Supabase host_messages select error, falling back:', err);
    }
  }

  const db = readJsonDb();
  return db.host_chats
    .filter(msg => msg.host_id === hostId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function sendHostChatMessage(msgData: Omit<HostChatMessage, 'id' | 'created_at' | 'is_read'>): Promise<HostChatMessage> {
  const newMsg: HostChatMessage = {
    id: 'msg-' + generateId(),
    ...msgData,
    is_read: false,
    created_at: new Date().toISOString()
  };

  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('host_messages')
        .insert({
          sender_id: msgData.sender_id,
          receiver_id: msgData.receiver_id,
          message: msgData.message_text
        })
        .select()
        .single();
      if (!error && data) {
        return {
          id: String(data.id),
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
          host_id: msgData.host_id,
          message_text: data.message,
          is_read: false,
          created_at: data.created_at
        };
      } else if (error) {
        console.error('Supabase host_messages insert error:', error);
      }
    } catch (err) {
      console.warn('Supabase host_messages insert error, falling back:', err);
    }
  }

  const db = readJsonDb();
  db.host_chats.push(newMsg);
  writeJsonDb(db);
  return newMsg;
}

export async function markHostChatAsRead(hostId: string, isAdmin: boolean): Promise<boolean> {
  // Since host_messages table doesn't have is_read column, return true immediately.
  return true;
}

export async function getUnreadHostChatCount(hostId: string, isAdmin: boolean): Promise<number> {
  // Since host_messages table doesn't have is_read column, return 0.
  return 0;
}

export async function updateHostProfile(userId: string, updates: Partial<User>): Promise<User> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase host profile update error, falling back:', err);
    }
  }

  const db = readJsonDb();
  const uIndex = db.users.findIndex(u => u.id === userId);
  if (uIndex !== -1) {
    db.users[uIndex] = {
      ...db.users[uIndex],
      ...updates
    };
    writeJsonDb(db);
    return db.users[uIndex];
  }
  throw new Error('User not found');
}

export async function getHostFollowers(hostId: string): Promise<HostFollower[]> {
  const db = readJsonDb();
  if (!db.host_followers) db.host_followers = [];
  
  // Seed followers if empty for this host, to make the UI look alive and featured!
  let hostFollowers = db.host_followers.filter(f => f.host_id === hostId);
  if (hostFollowers.length === 0) {
    const seedFollowers: HostFollower[] = [
      {
        id: 'fol-1',
        host_id: hostId,
        user_id: 'user-1',
        username: 'durov',
        profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        is_muted: false,
        is_banned: false,
        followed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'fol-2',
        host_id: hostId,
        user_id: 'user-2',
        username: 'tele_star',
        profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        is_muted: false,
        is_banned: false,
        followed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'fol-3',
        host_id: hostId,
        user_id: 'user-3',
        username: 'crypto_champ',
        profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        is_muted: true,
        is_banned: false,
        followed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'fol-4',
        host_id: hostId,
        user_id: 'user-4',
        username: 'ton_whale',
        profile_image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
        is_muted: false,
        is_banned: false,
        followed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ];
    db.host_followers = [...db.host_followers, ...seedFollowers];
    writeJsonDb(db);
    hostFollowers = seedFollowers;

    // Update user follower count in DB to match
    const uIndex = db.users.findIndex(u => u.id === hostId);
    if (uIndex !== -1) {
      db.users[uIndex].followers = hostFollowers.length;
      writeJsonDb(db);
    }
  }
  
  return hostFollowers;
}

export async function updateFollowerStatus(hostId: string, followerId: string, updates: Partial<HostFollower>): Promise<HostFollower> {
  const db = readJsonDb();
  if (!db.host_followers) db.host_followers = [];
  const index = db.host_followers.findIndex(f => f.host_id === hostId && f.id === followerId);
  if (index === -1) throw new Error('Follower not found');
  db.host_followers[index] = { ...db.host_followers[index], ...updates };
  writeJsonDb(db);
  return db.host_followers[index];
}

export async function getHostEarningsLogs(hostId: string): Promise<HostEarningsLog[]> {
  const db = readJsonDb();
  if (!db.host_earnings_logs) db.host_earnings_logs = [];
  
  // Seed earnings logs if empty, to make beautiful charts!
  let logs = db.host_earnings_logs.filter(l => l.host_id === hostId);
  if (logs.length === 0) {
    const seedLogs: HostEarningsLog[] = [
      {
        id: 'earn-1',
        host_id: hostId,
        amount: 150,
        source: 'stream_tip',
        description: 'Received tip for Awesome DJ Livestream Set!',
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'durov'
      },
      {
        id: 'earn-2',
        host_id: hostId,
        amount: 299,
        source: 'video_purchase',
        description: 'Video Purchase: Telegram Premium Features Tutorial',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'tele_star'
      },
      {
        id: 'earn-3',
        host_id: hostId,
        amount: 75,
        source: 'stream_tip',
        description: 'Live Tip: "You are the best stream host!"',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'crypto_champ'
      },
      {
        id: 'earn-4',
        host_id: hostId,
        amount: 500,
        source: 'subscription',
        description: 'Monthly Host Premium Fan Subscription Tier 2',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        username: 'ton_whale'
      },
      {
        id: 'earn-5',
        host_id: hostId,
        amount: 120,
        source: 'stream_tip',
        description: 'Stream Tip: Private Q&A session',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        username: 'durov'
      }
    ];
    db.host_earnings_logs = [...db.host_earnings_logs, ...seedLogs];
    writeJsonDb(db);
    logs = seedLogs;

    // Update user earnings in DB
    const uIndex = db.users.findIndex(u => u.id === hostId);
    if (uIndex !== -1) {
      const totalSeedEarnings = seedLogs.reduce((sum, log) => sum + log.amount, 0);
      db.users[uIndex].earnings = totalSeedEarnings;
      writeJsonDb(db);
    }
  }
  return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getHostWithdrawals(hostId: string): Promise<WithdrawalRequest[]> {
  const db = readJsonDb();
  if (!db.withdrawal_requests) db.withdrawal_requests = [];
  
  // Seed sample withdrawal requests if empty
  let withdrawals = db.withdrawal_requests.filter(w => w.host_id === hostId);
  if (withdrawals.length === 0) {
    const seedWithdrawals: WithdrawalRequest[] = [
      {
        id: 'wd-1',
        host_id: hostId,
        amount: 250,
        payout_method: 'UPI',
        payout_details: 'hostpay@paytm',
        status: 'approved',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'wd-2',
        host_id: hostId,
        amount: 400,
        payout_method: 'UPI',
        payout_details: 'hostpay@paytm',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    db.withdrawal_requests = [...db.withdrawal_requests, ...seedWithdrawals];
    writeJsonDb(db);
    withdrawals = seedWithdrawals;
  }
  return withdrawals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createWithdrawalRequest(hostId: string, req: { amount: number; payout_method: string; payout_details: string }): Promise<WithdrawalRequest> {
  const db = readJsonDb();
  if (!db.withdrawal_requests) db.withdrawal_requests = [];
  
  const newRequest: WithdrawalRequest = {
    id: 'wd-' + Math.random().toString(36).substring(2, 15),
    host_id: hostId,
    amount: req.amount,
    payout_method: req.payout_method,
    payout_details: req.payout_details,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  db.withdrawal_requests.push(newRequest);
  
  // Deduct from host's current earnings
  const uIndex = db.users.findIndex(u => u.id === hostId);
  if (uIndex !== -1) {
    const currentEarnings = db.users[uIndex].earnings || 0;
    db.users[uIndex].earnings = Math.max(0, currentEarnings - req.amount);
  }
  
  writeJsonDb(db);
  return newRequest;
}
