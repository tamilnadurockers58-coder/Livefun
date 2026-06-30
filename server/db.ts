import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { User, Video, Purchase, Settings, DashboardStats } from '../src/types';

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

// Read JSON database file
function readJsonDb(): { users: User[]; videos: Video[]; purchases: Purchase[]; settings: Settings } {
  try {
    if (!fs.existsSync(JSON_DB_PATH)) {
      const initialData = {
        users: DEFAULT_USERS,
        videos: DEFAULT_VIDEOS,
        purchases: DEFAULT_PURCHASES,
        settings: DEFAULT_SETTINGS
      };
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB, using defaults', err);
    return {
      users: DEFAULT_USERS,
      videos: DEFAULT_VIDEOS,
      purchases: DEFAULT_PURCHASES,
      settings: DEFAULT_SETTINGS
    };
  }
}

// Write JSON database file
function writeJsonDb(data: { users: User[]; videos: Video[]; purchases: Purchase[]; settings: Settings }) {
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
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((u: any) => ({
      ...u,
      profile_image: u.profile_image || u.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role: u.role || (u.telegram_id === '7966448931' || u.telegram_id === '8940498738' ? 'admin' : 'user')
    }));
  } else {
    const db = readJsonDb();
    return db.users
      .map(u => ({ ...u, role: u.role || (u.telegram_id === '7966448931' || u.telegram_id === '8940498738' ? 'admin' : 'user') }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('telegram_id', telegramId).maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      profile_image: data.profile_image || data.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      role: data.role || (telegramId === '7966448931' || telegramId === '8940498738' ? 'admin' : 'user')
    };
  } else {
    const db = readJsonDb();
    const user = db.users.find(u => u.telegram_id === telegramId);
    if (!user) return null;
    return {
      ...user,
      role: user.role || (telegramId === '7966448931' || telegramId === '8940498738' ? 'admin' : 'user')
    };
  }
}

export async function createOrUpdateUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const userRole = (userData.telegram_id === '7966448931' || userData.telegram_id === '8940498738') ? 'admin' : 'user';

  if (useSupabase && supabase) {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userData.telegram_id)
      .maybeSingle();

    if (existingUser) {
      const updates = {
        username: userData.username,
        photo_url: userData.profile_image,
        profile_image: userData.profile_image,
        role: userRole
      };

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        first_name: data.first_name || userData.first_name || '',
        last_name: data.last_name || userData.last_name || '',
        profile_image: data.profile_image || data.photo_url || userData.profile_image,
        role: data.role || userRole
      };
    } else {
      const newUser = {
        telegram_id: userData.telegram_id,
        username: userData.username,
        photo_url: userData.profile_image,
        profile_image: userData.profile_image,
        role: userRole
      };
      const { data, error } = await supabase.from('users').insert(newUser).select().single();
      if (error) throw error;
      return {
        ...data,
        first_name: data.first_name || userData.first_name || '',
        last_name: data.last_name || userData.last_name || '',
        profile_image: data.profile_image || data.photo_url || userData.profile_image,
        role: data.role || userRole
      };
    }
  } else {
    const db = readJsonDb();
    const existingIndex = db.users.findIndex(u => u.telegram_id === userData.telegram_id);
    if (existingIndex >= 0) {
      db.users[existingIndex] = {
        ...db.users[existingIndex],
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        profile_image: userData.profile_image,
        role: userRole
      };
      writeJsonDb(db);
      return db.users[existingIndex];
    } else {
      const newUser: User = {
        id: 'usr-' + generateId(),
        telegram_id: userData.telegram_id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        profile_image: userData.profile_image,
        created_at: new Date().toISOString(),
        role: userRole
      };
      db.users.push(newUser);
      writeJsonDb(db);
      return newUser;
    }
  }
}

export async function updateUserProfileImage(userId: string, imageUrl: string): Promise<User> {
  if (useSupabase && supabase) {
    let resolvedUserId = userId;
    let tgId = '';
    
    if (userId.startsWith('mock-usr-')) {
      tgId = userId.substring('mock-usr-'.length);
    } else if (userId.startsWith('mock-adm-')) {
      tgId = userId.substring('mock-adm-'.length);
    } else if (!userId.includes('-') && !isNaN(Number(userId))) {
      tgId = userId;
    }

    if (tgId) {
      const dbUser = await getUserByTelegramId(tgId);
      if (dbUser) {
        resolvedUserId = dbUser.id;
      } else {
        // Create user on-the-fly
        const newUser = await createOrUpdateUser({
          telegram_id: tgId,
          username: `user_${tgId}`,
          first_name: `User ${tgId}`,
          last_name: '',
          profile_image: imageUrl
        });
        return newUser;
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        profile_image: imageUrl,
        photo_url: imageUrl
      })
      .eq('id', resolvedUserId)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      profile_image: data.profile_image || data.photo_url
    };
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
  if (useSupabase && supabase) {
    let resolvedUserId = userId;
    let tgId = '';
    
    if (userId.startsWith('mock-usr-')) {
      tgId = userId.substring('mock-usr-'.length);
    } else if (userId.startsWith('mock-adm-')) {
      tgId = userId.substring('mock-adm-'.length);
    } else if (!userId.includes('-') && !isNaN(Number(userId))) {
      tgId = userId;
    }
    
    if (tgId) {
      const dbUser = await getUserByTelegramId(tgId);
      if (dbUser) {
        resolvedUserId = dbUser.id;
      } else {
        return [];
      }
    }
    
    const all = await getPurchases();
    return all.filter(p => p.user_id === resolvedUserId);
  } else {
    const all = await getPurchases();
    return all.filter(p => p.user_id === userId);
  }
}

export async function createPurchase(purchaseData: Omit<Purchase, 'id' | 'payment_status' | 'created_at'>): Promise<Purchase> {
  if (useSupabase && supabase) {
    const { id: _, ...restPurchaseData } = purchaseData as any;
    
    let resolvedUserId = restPurchaseData.user_id;
    let tgId = '';
    
    if (typeof resolvedUserId === 'string') {
      if (resolvedUserId.startsWith('mock-usr-')) {
        tgId = resolvedUserId.substring('mock-usr-'.length);
      } else if (resolvedUserId.startsWith('mock-adm-')) {
        tgId = resolvedUserId.substring('mock-adm-'.length);
      } else if (!resolvedUserId.includes('-') && !isNaN(Number(resolvedUserId))) {
        tgId = resolvedUserId;
      }
    }
    
    if (tgId) {
      let dbUser = await getUserByTelegramId(tgId);
      if (!dbUser) {
        // Create user in db on-the-fly without including 'id'
        dbUser = await createOrUpdateUser({
          telegram_id: tgId,
          username: `user_${tgId}`,
          first_name: `User ${tgId}`,
          last_name: '',
          profile_image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${tgId}`
        });
      }
      resolvedUserId = dbUser.id;
    }

    if (typeof resolvedUserId === 'string' && resolvedUserId.startsWith('mock-')) {
      throw new Error(`Forbidden: Mock user ID ${resolvedUserId} cannot be used in database calls.`);
    }

    const newPurchase = {
      ...restPurchaseData,
      user_id: resolvedUserId,
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
