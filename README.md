# Telegram Premium Video Streaming Platform

A production-ready, high-performance, full-stack video streaming application inspired by Telegram's dark slate design. This platform supports continuous video playback, direct UPI payments, and manual transaction verification (UTR Ref checks) with an administration dashboard.

## Tech Stack
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
* **Backend**: Express.js, Node.js, Tsx (development), Esbuild (production)
* **Database**: Supabase PostgreSQL
* **Storage**: ImageKit Cloud

---

## 🚀 Quick Start (Sandbox & Local Preview)
This platform features a **Dual-Mode Persistence & Upload Layer**.
If you do not specify Supabase or ImageKit environment credentials, the Express backend automatically falls back to:
1. **Local File Database (`db.json`)**: Pre-seeded with free & premium mock videos, sample users, and settings variables.
2. **Local Storage Folder (`/uploads`)**: Handles custom uploads of profile pictures, thumbnail images, and MP4 videos directly on the disk.

This allows the platform to be fully functional, testable, and interactive out-of-the-box in the sandbox environment.

### Local Installation
1. Clone your exported repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the development server on `http://localhost:3000`:
   ```bash
   npm run dev
   ```

---

## 🗄️ Supabase Setup Instructions
To transition from the local fallback to cloud storage, configure a free PostgreSQL database on Supabase:

1. **Create a project** at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard and execute the following queries to boot the database tables:

```sql
-- 1. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  upi_id TEXT NOT NULL,
  qr_image TEXT NOT NULL,
  support_email TEXT NOT NULL
);

-- Seed Initial settings (Update values as needed)
INSERT INTO settings (id, upi_id, qr_image, support_email)
VALUES ('global', 'telegrampremium@upi', 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400', 'support@tgpremiumstream.me')
ON CONFLICT (id) DO NOTHING;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PURCHASES TABLE
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  transaction_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

3. Copy the **Project URL** and **Anon Key** from Project Settings > API and place them in your environment variables.

---

## 📸 ImageKit Setup Instructions
To handle high-fidelity media uploads:

1. Create a free account at [ImageKit.io](https://imagekit.io).
2. Locate your developer credentials in your dashboard:
   - **URL Endpoint**
   - **Public Key**
   - **Private Key**
3. Input these keys in your `.env` or deployment variables. The platform will automatically direct user avatars, thumbnail cards, and MP4 uploads to the cloud.

---

## ☁️ Render Deployment Instructions

This project is configured to run fully as a Node.js fullstack service on **Render.com**.

### Option A: Monolithic Web Service (Simplest)
Render can compile the Vite frontend, bundle the server into CJS, and serve everything from a single Web Service:

1. Push this project to your GitHub repository.
2. Log in to [Render.com](https://render.com) and click **New > Web Service**.
3. Link your repository.
4. Set the following settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
5. Click **Advanced** and declare your **Environment Variables**:
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: *your-supabase-url*
   - `SUPABASE_KEY`: *your-supabase-anon-key*
   - `IMAGEKIT_PUBLIC_KEY`: *your-imagekit-public-key*
   - `IMAGEKIT_PRIVATE_KEY`: *your-imagekit-private-key*
   - `IMAGEKIT_URL_ENDPOINT`: *your-imagekit-endpoint-url*
   - `ADMIN_SECRET_KEY`: *your-admin-passcode* (e.g. `admin123`)

### Option B: Separating Frontend (Static) & Backend (Web Service)
If you wish to deploy the React frontend separately as a Render Static Site:

#### 1. Backend API Service
1. Create a **Web Service** on Render.
2. Build Command: `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
3. Start Command: `node dist/server.cjs`
4. Declare Environment Variables including database keys.

#### 2. Frontend Static Site
1. Create a **Static Site** on Render.
2. Build Command: `vite build`
3. Publish Directory: `dist`
4. Set Route Redirect Rules to support SPA Router fallbacks (redirect all `/*` paths to `/index.html` with status `200`).

---

## ⚙️ Environment Variables Summary
Define these variables in your deployment dashboard or local `.env`:

| Variable | Required | Description | Fallback Default |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | No | Your Supabase Project API URL | Offline file database |
| `SUPABASE_KEY` | No | Your Supabase Project Anon API key | Offline file database |
| `IMAGEKIT_PUBLIC_KEY` | No | ImageKit Developer Public Key | Local disk storage |
| `IMAGEKIT_PRIVATE_KEY` | No | ImageKit Developer Private Key | Local disk storage |
| `IMAGEKIT_URL_ENDPOINT`| No | ImageKit Developer URL Endpoint | Local disk storage |
| `ADMIN_SECRET_KEY` | No | Secure passcode for Admin Console | `admin123` |
