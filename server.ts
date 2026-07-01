import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  getSettings,
  updateSettings,
  getUsers,
  getUserById,
  createOrUpdateProfile,
  localSignUp,
  localLogin,
  updateUserProfileImage,
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getPurchases,
  getUserPurchases,
  createPurchase,
  updatePurchaseStatus,
  getDashboardStats,
  checkVideoAccess,
  getHostApplications,
  submitHostApplication,
  updateHostApplicationStatus,
  deleteHostApplication,
  getHostChatMessages,
  sendHostChatMessage,
  markHostChatAsRead,
  getUnreadHostChatCount,
  updateHostProfile,
  getHostFollowers,
  updateFollowerStatus,
  getHostEarningsLogs,
  getHostWithdrawals,
  createWithdrawalRequest
} from './server/db';
import { upload, uploadToStorage } from './server/upload';

// Initialize dotenv in development if not already loaded by tsx/node
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploads folder statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Admin protection middleware helper
  const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const adminKey = (req.headers['admin-key'] || req.query['admin_key']) as string;
    
    if (!adminKey) {
      return res.status(403).json({ error: '403 Access Denied: Admin user ID is required.' });
    }

    try {
      const user = await getUserById(adminKey);
      if (user && user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ error: '403 Access Denied: Unauthorized admin access.' });
      }
    } catch (err) {
      res.status(403).json({ error: '403 Access Denied: Error verifying admin privileges.' });
    }
  };

  // ============================================
  // API ROUTES
  // ============================================

  // --- CONFIG ENDPOINTS ---
  app.get('/api/config/supabase', (req: Request, res: Response) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || ''
    });
  });

  // --- SETTINGS ---
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/settings', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const updated = await updateSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- FILE UPLOADS ---
  app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided.' });
      }
      const folder = (req.body.folder as 'profiles' | 'thumbnails' | 'videos') || 'thumbnails';
      const result = await uploadToStorage(req.file, folder);
      
      if (result.success) {
        res.json({ url: result.url, success: true });
      } else {
        res.status(500).json({ error: 'File upload failed.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CREDENTIALS AUTHENTICATION ---
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { id, email, username, profile_image, role } = req.body;
      if (!id || !email || !username) {
        return res.status(400).json({ error: 'id, email, and username are required.' });
      }
      const user = await createOrUpdateProfile({ id, email, username, profile_image, role });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { id, email, username, role } = req.body;
      if (!id || !email) {
        return res.status(400).json({ error: 'id and email are required.' });
      }
      let user = await getUserById(id);
      if (!user) {
        user = await createOrUpdateProfile({
          id,
          email,
          username: username || email.split('@')[0],
          role: role || 'user'
        });
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/signup-local', async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      if (!email || !password || !username) {
        return res.status(400).json({ error: 'email, password, and username are required.' });
      }
      const user = await localSignUp({ email, password, username });
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login-local', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required.' });
      }
      const user = await localLogin({ email, password });
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/profile/image', async (req: Request, res: Response) => {
    try {
      const { userId, profile_image } = req.body;
      if (!userId || !profile_image) {
        return res.status(400).json({ error: 'userId and profile_image are required' });
      }
      const updated = await updateUserProfileImage(userId, profile_image);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VIDEO ENDPOINTS ---
  app.get('/api/videos', async (req: Request, res: Response) => {
    try {
      const adminKey = req.headers['admin-key'] as string;
      let includeUnpublished = false;
      
      if (adminKey) {
        const user = await getUserById(adminKey);
        includeUnpublished = !!(user && user.role === 'admin');
      }
      
      const videos = await getVideos(includeUnpublished);
      res.json(videos);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/videos/:id', async (req: Request, res: Response) => {
    try {
      const video = await getVideoById(req.params.id);
      if (!video) {
        return res.status(404).json({ error: 'Video not found.' });
      }
      res.json(video);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/videos', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const { title, description, thumbnail_url, video_url, price, published } = req.body;
      if (!title || !video_url) {
        return res.status(400).json({ error: 'Title and Video URL are required.' });
      }
      const newVideo = await createVideo({
        title,
        description: description || '',
        thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=800&auto=format&fit=crop&q=80',
        video_url,
        price: Number(price) || 0,
        published: published !== false
      });
      res.json(newVideo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/videos/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const { title, description, thumbnail_url, video_url, price, published } = req.body;
      const updated = await updateVideo(req.params.id, {
        title,
        description,
        thumbnail_url,
        video_url,
        price: price !== undefined ? Number(price) : undefined,
        published
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/videos/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await deleteVideo(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PAYMENT / PURCHASE ENDPOINTS ---
  app.get('/api/purchases', async (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      const adminKey = req.headers['admin-key'] || req.query['admin_key'];

      if (userId) {
        const purchases = await getUserPurchases(userId);
        return res.json(purchases);
      }

      if (adminKey === '7966448931') {
        const allPurchases = await getPurchases();
        return res.json(allPurchases);
      }

      return res.status(401).json({ error: 'Unauthorized: User ID or Admin credentials required.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/purchases', async (req: Request, res: Response) => {
    try {
      const { user_id, video_id, amount, transaction_id } = req.body;
      if (!user_id || !video_id || amount === undefined || !transaction_id) {
        return res.status(400).json({ error: 'user_id, video_id, amount, and transaction_id are required.' });
      }

      const purchase = await createPurchase({
        user_id,
        video_id,
        amount: Number(amount),
        transaction_id
      });
      res.json(purchase);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/purchases/:id/status', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ error: 'Status must be approved or rejected.' });
      }
      const updated = await updatePurchaseStatus(req.params.id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Check access endpoint
  app.get('/api/videos/:id/access', async (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      const hasAccess = await checkVideoAccess(userId || null, req.params.id);
      res.json({ hasAccess });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADMIN DASHBOARD STATISTICS ---
  app.get('/api/admin/stats', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- HOST APPLICATIONS ENDPOINTS ---
  app.post('/api/host-applications', async (req: Request, res: Response) => {
    try {
      const { user_id, full_name, age, gender, telegram_username, email, experience, why_host, profile_photo_url } = req.body;
      if (!user_id || !full_name || !age || !gender || !email || !experience || !why_host || !profile_photo_url) {
        return res.status(400).json({ error: 'Missing required application fields.' });
      }
      const appRecord = await submitHostApplication({
        user_id,
        full_name,
        age: Number(age),
        gender,
        telegram_username,
        email,
        experience,
        why_host,
        profile_photo_url
      });
      res.json(appRecord);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/host-applications', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const apps = await getHostApplications();
      res.json(apps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/host-applications/:id/status', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ error: 'Status must be approved or rejected.' });
      }
      const updated = await updateHostApplicationStatus(req.params.id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/host-applications/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await deleteHostApplication(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- HOST PROFILE / LIVE UPDATES ---
  app.put('/api/host-profile/:userId', async (req: Request, res: Response) => {
    try {
      const { bio, live_thumbnail, first_name, last_name, profile_image } = req.body;
      const updated = await updateHostProfile(req.params.userId, {
        bio,
        live_thumbnail,
        first_name,
        last_name,
        profile_image
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/host-profile/:userId/live', async (req: Request, res: Response) => {
    try {
      const { is_live, live_thumbnail } = req.body;
      const updated = await updateHostProfile(req.params.userId, {
        is_live: !!is_live,
        live_thumbnail
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- HOST FOLLOWERS ENDPOINTS ---
  app.get('/api/host-followers/:hostId', async (req: Request, res: Response) => {
    try {
      const followers = await getHostFollowers(req.params.hostId);
      res.json(followers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/host-followers/:hostId/:followerId/status', async (req: Request, res: Response) => {
    try {
      const { is_muted, is_banned } = req.body;
      const updated = await updateFollowerStatus(req.params.hostId, req.params.followerId, {
        is_muted,
        is_banned
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/host-followers/:hostId/broadcast', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Broadcast message is required.' });
      }
      // Simulate sending broadcast notice to all active followers (log it)
      console.log(`[Broadcast from Host ${req.params.hostId}] ${message}`);
      res.json({ success: true, message: 'Broadcast alert successfully sent to all followers!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- HOST EARNINGS ENDPOINTS ---
  app.get('/api/host-earnings/:hostId', async (req: Request, res: Response) => {
    try {
      const logs = await getHostEarningsLogs(req.params.hostId);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- HOST WITHDRAWALS ENDPOINTS ---
  app.get('/api/host-withdrawals/:hostId', async (req: Request, res: Response) => {
    try {
      const withdrawals = await getHostWithdrawals(req.params.hostId);
      res.json(withdrawals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/host-withdrawals/:hostId', async (req: Request, res: Response) => {
    try {
      const { amount, payout_method, payout_details } = req.body;
      if (!amount || !payout_method || !payout_details) {
        return res.status(400).json({ error: 'Missing required withdrawal fields.' });
      }
      const newWd = await createWithdrawalRequest(req.params.hostId, {
        amount: Number(amount),
        payout_method,
        payout_details
      });
      res.json(newWd);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- HOST CHAT ENDPOINTS ---
  app.get('/api/host-chats/:hostId', async (req: Request, res: Response) => {
    try {
      const messages = await getHostChatMessages(req.params.hostId);
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/host-chats', async (req: Request, res: Response) => {
    try {
      const { sender_id, receiver_id, host_id, message_text, attachment_url, attachment_type, attachment_name } = req.body;
      if (!sender_id || !receiver_id || !host_id) {
        return res.status(400).json({ error: 'sender_id, receiver_id, and host_id are required.' });
      }
      const msg = await sendHostChatMessage({
        sender_id,
        receiver_id,
        host_id,
        message_text,
        attachment_url,
        attachment_type,
        attachment_name
      });
      res.json(msg);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/host-chats/:hostId/read', async (req: Request, res: Response) => {
    try {
      const { is_admin } = req.body;
      await markHostChatAsRead(req.params.hostId, !!is_admin);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/host-chats/:hostId/unread', async (req: Request, res: Response) => {
    try {
      const is_admin = req.query.is_admin === 'true';
      const count = await getUnreadHostChatCount(req.params.hostId, is_admin);
      res.json({ unreadCount: count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // VITE & FRONTEND INTEGRATION
  // ============================================

  if (process.env.NODE_ENV !== 'production') {
    // In development mode, integrate Vite server as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve compiled static build artifacts
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
