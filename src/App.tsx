import React, { useState, useEffect } from 'react';
import { User, Video, Purchase, Settings } from './types';
import TelegramLogin from './components/TelegramLogin';
import UserProfile from './components/UserProfile';
import VideoPlayer from './components/VideoPlayer';
import AdminDashboard from './components/AdminDashboard';
import PaymentModal from './components/PaymentModal';
import { 
  Send, User as UserIcon, ShieldAlert, Sparkles, Film, ArrowLeft, 
  Search, Play, Lock, AlertTriangle, HelpCircle, Mail, Key, Radio, Eye, CheckCircle2
} from 'lucide-react';

export default function App() {
  // Production Security States
  const [isFocused, setIsFocused] = useState(true);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  // Authentication states
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Platform catalog & settings states
  const [videos, setVideos] = useState<Video[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Navigation states
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'admin'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Video & Playing state
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Payment checkout state
  const [checkoutVideo, setCheckoutVideo] = useState<Video | null>(null);
  const [pausedAtTimestamp, setPausedAtTimestamp] = useState<number>(0);
  const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);

  // Toast indicator state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch videos and settings on load
  useEffect(() => {
    fetchCatalog();
    fetchSettings();
  }, []);

  // Synchronize /admin path with Admin tab for authorized user
  useEffect(() => {
    if (window.location.pathname === '/admin' && user?.telegram_id === '7966448931') {
      setActiveTab('admin');
    }
  }, [user]);

  // Global Production Security Restrictions
  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Disable right click globally
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Disable drag & drop globally
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('drop', handleDrop);

    // DevTools Detection
    const devToolsCheck = () => {
      const hostname = window.location.hostname;
      const isSandboxOrPreview = 
        hostname === 'localhost' || 
        hostname.includes('aistudio.google.com') || 
        hostname.includes('google.com') || 
        hostname.includes('.run.app');

      if (isSandboxOrPreview) {
        setIsDevToolsOpen(false);
        return;
      }

      const threshold = 160;
      const widthDev = window.outerWidth - window.innerWidth > threshold;
      const heightDev = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDev || heightDev) {
        setIsDevToolsOpen(true);
      } else {
        setIsDevToolsOpen(false);
      }
    };

    const interval = setInterval(devToolsCheck, 1500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('drop', handleDrop);
      clearInterval(interval);
    };
  }, []);

  // Fetch access rights and purchase logs when user or active video changes
  useEffect(() => {
    if (activeVideo) {
      checkAccessRights();
    } else {
      setHasAccess(false);
    }
  }, [activeVideo, user]);

  useEffect(() => {
    if (user) {
      fetchUserPurchases();
    } else {
      setUserPurchases([]);
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCatalog = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await fetch('/api/videos');
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
        // Default to first video if any exist
        if (data.length > 0 && !activeVideo) {
          setActiveVideo(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching catalog', err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        setSettings(await response.json());
      }
    } catch (err) {
      console.error('Error fetching settings', err);
    }
  };

  const fetchUserPurchases = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/purchases?user_id=${user.id}`);
      if (response.ok) {
        setUserPurchases(await response.json());
      }
    } catch (err) {
      console.error('Error fetching user purchases', err);
    }
  };

  const checkAccessRights = async () => {
    if (!activeVideo) return;
    if (activeVideo.price <= 0) {
      setHasAccess(true);
      return;
    }
    if (!user) {
      setHasAccess(false);
      return;
    }

    setCheckingAccess(true);
    try {
      const response = await fetch(`/api/videos/${activeVideo.id}/access?user_id=${user.id}`);
      if (response.ok) {
        const { hasAccess: allowed } = await response.json();
        setHasAccess(allowed);
      }
    } catch (err) {
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('tg_user', JSON.stringify(newUser));
    const isAdmin = newUser.telegram_id === '7966448931';
    if (isAdmin) {
      localStorage.setItem('admin_key', newUser.telegram_id);
      showToast(`Welcome Administrator, ${newUser.first_name}!`, 'success');
    } else {
      showToast(`Welcome back, ${newUser.first_name}!`, 'success');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tg_user');
    localStorage.removeItem('admin_key');
    setActiveTab('feed');
    showToast('Logged out of Telegram.', 'info');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('tg_user', JSON.stringify(updatedUser));
  };

  const handleUnlockTrigger = (pausedAt: number) => {
    if (!user) {
      showToast('Please log in with Telegram first to purchase and unlock streams.', 'error');
      return;
    }
    
    // Save current paused timestamp so we can resume from it after approval
    setPausedAtTimestamp(pausedAt);
    localStorage.setItem(`resume_${activeVideo?.id}`, String(pausedAt));
    setCheckoutVideo(activeVideo);
  };

  const handlePaymentSubmission = async (transactionId: string) => {
    if (!user || !checkoutVideo) return;

    const payload = {
      user_id: user.id,
      video_id: checkoutVideo.id,
      amount: checkoutVideo.price,
      transaction_id: transactionId
    };

    const response = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showToast('UPI payment submitted. Awaiting administrator approval.', 'success');
      fetchUserPurchases();
    } else {
      const err = await response.json();
      throw new Error(err.error || 'Failed to submit payment details');
    }
  };

  const handleSelectVideoFromLibrary = (videoId: string) => {
    const targetVideo = videos.find(v => v.id === videoId);
    if (targetVideo) {
      setActiveVideo(targetVideo);
      setActiveTab('feed');
      // Scroll to video stage
      document.getElementById('video-player-stage')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter videos based on search criteria - only published videos
  const filteredVideos = videos.filter(v => 
    (v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (v.published !== false)
  );

  // Active video's purchase status
  const activeVideoPurchase = userPurchases.find(p => p.video_id === activeVideo?.id);
  const activeVideoStatus = activeVideoPurchase ? activeVideoPurchase.payment_status : null;

  const isAtAdminPath = window.location.pathname === '/admin';
  const isUserAdmin = user?.telegram_id === '7966448931';

  if (isAtAdminPath && !isUserAdmin) {
    return (
      <div className="min-h-screen bg-[#0e1621] text-gray-200 flex flex-col items-center justify-center p-6 font-sans" id="access-denied-view">
        <div className="max-w-md w-full bg-[#17212b] border border-[#24303f] rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">403 Access Denied</h1>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            You do not have administrative clearance to access this control interface. Unauthorized access attempts are monitored and recorded.
          </p>
          <div className="mt-8 pt-6 border-t border-[#24303f]">
            <button
              onClick={() => { window.location.href = '/' }}
              className="px-6 py-2.5 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-xl text-xs font-bold transition duration-200"
            >
              Return to Stream Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0e1621] text-gray-200 font-sans selection:bg-[#2481cc]/30 selection:text-white flex flex-col justify-between items-center p-4 py-12" id="login-screen-wrapper">
        {toast && (
          <div 
            className={`fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl border z-50 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-[#24303f] border-[#24303f] text-sky-400'
            }`}
            id="toast-notification-banner"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-sky-400'}`}></div>
            {toast.message}
          </div>
        )}
        <div className="w-full max-w-md my-auto space-y-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 bg-[#2481cc] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#2481cc]/25">
              <Send className="w-8 h-8 transform -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Telegram Premium Portal</h2>
              <p className="text-xs text-gray-400">Please connect your Telegram account to continue</p>
            </div>
          </div>
          <TelegramLogin onLogin={handleLogin} isLoading={isAuthLoading} />
        </div>
        <footer className="text-center text-[10px] text-gray-600 font-medium">
          <p>© 2026 Telegram Premium Streaming platform. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] text-gray-200 font-sans selection:bg-[#2481cc]/30 selection:text-white" id="main-app-container">
      
      {/* DevTools Security Warning Overlay */}
      {isDevToolsOpen && (
        <div className="fixed inset-0 bg-[#0e1621] text-center flex flex-col items-center justify-center p-6 z-[99999]">
          <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Security System Triggered</h2>
          <p className="text-xs text-gray-400 mt-2 max-w-sm leading-relaxed">
            Developer DevTools / Inspector has been detected. For absolute digital rights management (DRM) and content security, streaming is disabled while inspection tools are active.
          </p>
          <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-widest font-mono">
            Close Developer Tools & Refresh page
          </p>
        </div>
      )}

      {/* Focus Blur Overlay */}
      {!isFocused && (
        <div className="fixed inset-0 bg-[#0e1621]/95 backdrop-blur-2xl text-center flex flex-col items-center justify-center p-6 z-[9999]">
          <div className="w-14 h-14 bg-[#2481cc]/10 text-[#2481cc] rounded-full flex items-center justify-center border border-[#2481cc]/20 mb-4 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">Stream Feed Hidden</h2>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-relaxed">
            Live stream is hidden because the browser window has lost focus. Click back to resume.
          </p>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl border z-50 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in ${
            toast.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-[#24303f] border-[#24303f] text-sky-400'
          }`}
          id="toast-notification-banner"
        >
          <div className={`w-1.5 h-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : toast.type === 'error' ? 'bg-rose-400' : 'bg-sky-400'}`}></div>
          {toast.message}
        </div>
      )}

      {/* Main Grid Wrapper */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 space-y-6">
        
        {/* Navigation / Brand Header */}
        <header className="flex items-center justify-between bg-[#17212b] border border-[#24303f] px-4 py-3 rounded-2xl shadow-lg relative overflow-hidden" id="navigation-header">
          {/* Subtle logo backdrop */}
          <div className="absolute top-0 right-0 w-32 h-full bg-[#2481cc]/5 transform skew-x-12 pointer-events-none"></div>

          {/* Logo Brand */}
          <div 
            onClick={() => { setActiveTab('feed'); setActiveVideo(videos[0] || null); }} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-98 transition"
            id="brand-logo"
          >
            <div className="w-9 h-9 bg-[#2481cc] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#2481cc]/25">
              <Send className="w-5 h-5 transform -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block tracking-tight leading-tight">Telegram Premium</span>
              <span className="text-[10px] text-gray-400 font-medium">Video Streaming Portal</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('feed')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'feed' ? 'bg-[#2481cc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Stream Feed
            </button>

            {user && user.telegram_id === '7966448931' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'admin' ? 'bg-[#2481cc] text-white shadow shadow-[#2481cc]/50' : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/15'
                }`}
                id="header-admin-btn"
              >
                Admin Panel
              </button>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 text-left ${
                    activeTab === 'profile' ? 'bg-[#2481cc] text-white' : 'text-gray-400 hover:text-white bg-[#24303f]/40 border border-[#24303f]/35 hover:bg-[#24303f]/70'
                  }`}
                  id="header-profile-btn"
                >
                  <img 
                    src={user.profile_image} 
                    alt={user.first_name} 
                    className="w-5 h-5 rounded-full object-cover border border-[#2481cc]/20" 
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="font-bold text-[11px] block">{user.first_name}</span>
                    {user.username && <span className="text-[9px] text-[#2481cc] block">@{user.username}</span>}
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 px-3 py-1.5 rounded-lg transition active:scale-95"
                  id="header-logout-btn"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* =========================================================
            VIEW 1: SECURE ADMIN CONSOLE
            ========================================================= */}
        {activeTab === 'admin' && user && user.telegram_id === '7966448931' && (
          <div className="min-h-[70vh]">
            <AdminDashboard onClose={() => setActiveTab('feed')} />
          </div>
        )}

        {/* =========================================================
            VIEW 2: USER PROFILE / LOGIN BOARD
            ========================================================= */}
        {activeTab === 'profile' && (
          <div className="min-h-[70vh] flex items-center justify-center animate-fade-in" id="profile-container-view">
            {user ? (
              <div className="w-full">
                <UserProfile 
                  user={user} 
                  onLogout={handleLogout} 
                  onUpdateUser={handleUpdateUser}
                  onSelectVideo={handleSelectVideoFromLibrary}
                />
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <TelegramLogin onLogin={handleLogin} isLoading={isAuthLoading} />
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            VIEW 3: CENTRAL VIDEO FEED AND PLAYER (DEFAULT VIEW)
            ========================================================= */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="stream-feed-view">
            
            {/* Left/Middle Column (2 Cols wide on large screen): Video Stage */}
            <div className="lg:col-span-2 space-y-4" id="video-player-stage">
              {activeVideo ? (
                <>
                  <VideoPlayer 
                    video={activeVideo} 
                    user={user}
                    hasAccess={hasAccess} 
                    onUnlock={handleUnlockTrigger}
                    purchaseStatus={activeVideoStatus}
                  />

                  {/* Payment pending / status block under player */}
                  {activeVideo.price > 0 && !hasAccess && user && (
                    <div className="p-4 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md bg-amber-500/5 border-amber-500/10">
                      <div className="flex gap-2.5 items-start">
                        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-[13px]">
                            {activeVideoStatus === 'pending' 
                              ? '⏳ Direct UPI payment request pending approval' 
                              : activeVideoStatus === 'rejected'
                              ? '❌ Direct UPI payment rejected by Administrator'
                              : '🔒 Premium Content Blocked'
                            }
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            {activeVideoStatus === 'pending'
                              ? 'Admin is auditing transaction logs. Once approved, the full video will unlock instantly.'
                              : activeVideoStatus === 'rejected'
                              ? 'Check your transaction reference and request a re-submission or contact support.'
                              : `This streaming content requires a direct UPI contribution of ₹${activeVideo.price}.`
                            }
                          </p>
                        </div>
                      </div>
                      
                      {activeVideoStatus !== 'pending' && (
                        <button
                          onClick={() => handleUnlockTrigger(0)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95 whitespace-nowrap self-end sm:self-center"
                        >
                          Unlock Video Now
                        </button>
                      )}
                    </div>
                  )}

                  {/* Logged in CTA if not authorized */}
                  {!user && activeVideo.price > 0 && (
                    <div className="p-4 rounded-xl border border-sky-500/10 bg-sky-500/5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex gap-2.5 items-start">
                        <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-[13px]">Unlock Premium Streaming Library</p>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            To unlock premium streams, please connect your Telegram account first to bind transactions to your profile.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveTab('profile'); }}
                        className="bg-[#2481cc] hover:bg-[#179cde] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95 whitespace-nowrap"
                      >
                        Connect Telegram
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#17212b] border border-[#24303f] rounded-2xl p-12 text-center text-gray-400">
                  <Film className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white">No Stream Selected</h3>
                  <p className="text-xs mt-1">Please select an active streaming card from the catalog feed.</p>
                </div>
              )}
            </div>

            {/* Right Column (1 Col wide): Catalog List Feed */}
            <div className="lg:col-span-1 space-y-4" id="video-catalog-feed">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search stream catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#17212b] border border-[#24303f] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                  id="search-catalog-input"
                />
              </div>

              {/* Feed Card */}
              <div className="bg-[#17212b] border border-[#24303f] rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#24303f]">
                  <span className="text-xs font-bold text-white tracking-tight uppercase">Stream Feed Catalog</span>
                  <span className="text-[10px] text-gray-400 font-semibold font-mono">{filteredVideos.length} Streams</span>
                </div>

                {isLoadingVideos ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="w-8 h-8 border-2 border-t-transparent border-[#2481cc] rounded-full animate-spin"></div>
                  </div>
                ) : filteredVideos.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                    <p className="text-xs">No active streams found matching query.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1" id="feed-catalog-list">
                    {filteredVideos.map((v) => {
                      const isSelected = activeVideo?.id === v.id;
                      const hasBought = userPurchases.some(p => p.video_id === v.id && p.payment_status === 'approved');
                      
                      // Calculate a realistic static viewer count based on the video ID string
                      const viewerSeed = Math.abs(v.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
                      const liveViewers = (viewerSeed % 600) + 850; // Stable number between 850 and 1450
                      
                      // Calculate a realistic stream duration based on title length
                      const streamHours = (v.title.length % 2) + 1;
                      const streamMins = (v.title.length * 7) % 60;
                      const durationStr = `${streamHours}h ${streamMins}m elapsed`;

                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setActiveVideo(v);
                            // Scroll to player stage on mobile
                            if (window.innerWidth < 1024) {
                              document.getElementById('video-player-stage')?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer group ${
                            isSelected 
                              ? 'bg-red-500/5 border-red-500/45 text-white shadow-md shadow-red-500/5' 
                              : 'bg-[#1a232e]/80 border-[#24303f] hover:bg-[#24303f]/50 hover:border-[#24303f]/80'
                          }`}
                          id={`feed-item-${v.id}`}
                        >
                          {/* Live Thumbnail Frame */}
                          <div className="relative w-24 h-16 bg-[#0e1621] rounded-lg overflow-hidden flex-shrink-0 border border-[#24303f]">
                            <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition duration-200"></div>
                            
                            {/* Blinking LIVE badge on thumbnail corner */}
                            <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                              <span>LIVE</span>
                            </div>

                            {/* Premium Lock Overlay badge */}
                            {v.price > 0 && !hasBought && (
                              <div className="absolute bottom-1.5 right-1.5 bg-black/75 p-1 rounded backdrop-blur-sm text-amber-400 border border-amber-500/20">
                                <Lock className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>

                          {/* Live Stream Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-16">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-extrabold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/10 tracking-tight flex items-center gap-1 uppercase animate-pulse">
                                  Streaming...
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono">{durationStr}</span>
                              </div>
                              <h4 className="text-[11px] font-bold line-clamp-1 leading-tight group-hover:text-red-400 transition-colors">
                                {v.title}
                              </h4>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px]">
                              {/* Price / Unlock state */}
                              {v.price > 0 ? (
                                <span className={`font-bold text-[10px] flex items-center gap-1 ${hasBought ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {hasBought ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Unlocked
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" /> ₹{v.price}
                                    </>
                                  )}
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-bold text-[10px]">FREE FEED</span>
                              )}

                              {/* Real-time viewer count on card */}
                              <span className="text-gray-400 flex items-center gap-1 font-mono text-[9px] bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                                <Eye className="w-3 h-3 text-gray-500" /> {liveViewers.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Extra Support Block */}
              <div className="bg-[#17212b] border border-[#24303f] rounded-2xl p-4 flex items-start gap-3 text-xs leading-relaxed text-gray-400">
                <HelpCircle className="w-5 h-5 text-[#2481cc] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-[11px]">Direct UPI Node Gateway</p>
                  <p className="text-[10px] mt-0.5">
                    Payments are audited manually by platform operators using transaction ref IDs. Allow 5-15 mins for unlocks.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* =========================================================
          UPI DIRECT QR CHECKOUT DIALOG MODAL Overlay
          ========================================================= */}
      {checkoutVideo && settings && user && (
        <PaymentModal 
          video={checkoutVideo} 
          settings={settings} 
          user={user} 
          onClose={() => setCheckoutVideo(null)} 
          onSubmitPurchase={handlePaymentSubmission}
        />
      )}

      {/* Main Footer credit */}
      <footer className="py-6 border-t border-[#24303f] bg-[#0e1621] text-center text-xs text-gray-500">
        <p>© 2026 Telegram Premium Live Streaming Platform. All rights reserved.</p>
      </footer>

    </div>
  );
}
