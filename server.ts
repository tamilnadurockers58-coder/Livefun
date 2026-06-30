import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  getSettings,
  updateSettings,
  getUsers,
  getUserByTelegramId,
  createOrUpdateUser,
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
  checkVideoAccess
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
  const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.headers['admin-key'] || req.query['admin_key'];
    
    if (adminKey === '7966448931') {
      next();
    } else {
      res.status(403).json({ error: '403 Access Denied: Unauthorized admin access.' });
    }
  };

  // ============================================
  // API ROUTES
  // ============================================

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

  // --- TELEGRAM LOGIN & USERS ---
  app.post('/api/auth/telegram', async (req: Request, res: Response) => {
    try {
      const authData = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      // If they passed ID but no hash, and we have a BOT_TOKEN, reject it as invalid/mocked data.
      if (!authData.id && authData.telegram_id) {
        // Map from custom form if no bot token is set to facilitate preview transition
        authData.id = authData.telegram_id;
      }

      if (!authData.id) {
        return res.status(400).json({ error: 'id (Telegram User ID) is required' });
      }

      // Cryptographic signature verification
      if (botToken) {
        const { hash, ...data } = authData;
        if (!hash) {
          return res.status(401).json({ error: 'Unauthorized: Missing Telegram verification hash.' });
        }

        // Filter and sort parameters alphabetically
        const dataCheckString = Object.keys(data)
          .sort()
          .map(key => `${key}=${data[key]}`)
          .join('\n');

        const secretKey = crypto.createHash('sha256').update(botToken).digest();
        const computedHash = crypto.createHmac('sha256', secretKey)
          .update(dataCheckString)
          .digest('hex');

        if (computedHash !== hash) {
          return res.status(401).json({ error: 'Unauthorized: Telegram hash signature verification failed.' });
        }

        // Session date check (maximum 30 days)
        const authDate = Number(data.auth_date);
        const now = Math.floor(Date.now() / 1000);
        if (isNaN(authDate) || now - authDate > 86400 * 30) {
          return res.status(401).json({ error: 'Unauthorized: Authentication session has expired.' });
        }
      } else {
        console.warn("⚠️ TELEGRAM_BOT_TOKEN is not set in environment. Running in sandbox simulation mode.");
      }

      const telegram_id = String(authData.id);
      const username = authData.username || '';
      const first_name = authData.first_name || '';
      const last_name = authData.last_name || '';
      const profile_image = authData.photo_url || authData.profile_image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username || telegram_id}`;

      const user = await createOrUpdateUser({
        telegram_id,
        username,
        first_name,
        last_name,
        profile_image
      });

      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      const isAdmin = req.query.admin === 'true';
      const adminKey = req.headers['admin-key'];
      
      const includeUnpublished = isAdmin && adminKey === '7966448931';
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
