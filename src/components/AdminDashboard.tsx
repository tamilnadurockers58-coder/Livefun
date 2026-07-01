import React, { useState, useEffect } from 'react';
import { Video, User, Purchase, Settings, DashboardStats } from '../types';
import { 
  Users, Video as VideoIcon, CreditCard, DollarSign, Clock, Check, X, Plus, 
  Trash2, Edit2, Upload, Eye, EyeOff, Save, Key, Mail, Sparkles, CheckCircle2,
  AlertCircle, Radio
} from 'lucide-react';
import AdminHostApplications from './AdminHostApplications';

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [adminKey, setAdminKey] = useState(() => {
    try {
      const streamUserSaved = localStorage.getItem('stream_user');
      if (streamUserSaved) {
        const user = JSON.parse(streamUserSaved);
        if (user.role === 'admin') {
          return user.id;
        }
      }
    } catch (e) {}
    return localStorage.getItem('admin_key') || '';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const streamUserSaved = localStorage.getItem('stream_user');
      if (streamUserSaved) {
        const user = JSON.parse(streamUserSaved);
        if (user.role === 'admin') {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });
  const [loginError, setLoginError] = useState('');
  const [passcode, setPasscode] = useState('');
  
  // Dashboard state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Loading & active views
  const [activeTab, setActiveTab] = useState<'stats' | 'videos' | 'purchases' | 'settings' | 'hosts'>('stats');
  const [isLoading, setIsLoading] = useState(false);
  
  // Forms states
  const [videoForm, setVideoForm] = useState<Partial<Video>>({
    title: '',
    description: '',
    thumbnail_url: '',
    video_url: '',
    price: 0,
    published: true
  });
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [videoSuccessMsg, setVideoSuccessMsg] = useState('');
  const [videoErrorMsg, setVideoErrorMsg] = useState('');

  // Upload states
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingField, setUploadingField] = useState<'thumbnail' | 'video' | 'qr' | null>(null);

  // Validate admin login with backend on load
  useEffect(() => {
    if (adminKey) {
      testAdminAuth();
    }
  }, [adminKey]);

  // Load section data when tab changes or logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, activeTab]);

  const testAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'admin-key': adminKey }
      });
      if (response.ok) {
        setIsLoggedIn(true);
        localStorage.setItem('admin_key', adminKey);
      } else {
        localStorage.removeItem('admin_key');
        setAdminKey('');
      }
    } catch {
      localStorage.removeItem('admin_key');
      setAdminKey('');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'admin-key': passcode }
      });
      if (response.ok) {
        setAdminKey(passcode);
        setIsLoggedIn(true);
        localStorage.setItem('admin_key', passcode);
      } else {
        setLoginError('Invalid Admin Key passcode.');
      }
    } catch {
      setLoginError('Server authentication error.');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'admin-key': adminKey };
      
      // Load stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Load all videos (including unpublished)
      const videosRes = await fetch('/api/videos?admin=true', { headers });
      if (videosRes.ok) {
        setVideos(await videosRes.json());
      }

      // Load purchases
      const purchasesRes = await fetch(`/api/purchases?admin_key=${adminKey}`);
      if (purchasesRes.ok) {
        setPurchases(await purchasesRes.json());
      }

      // Load settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }
    } catch (err) {
      console.error('Error loading admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve/Reject payment
  const handlePaymentStatus = async (purchaseId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-key': adminKey
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        loadData(); // Reload statistics and purchases
      } else {
        alert('Failed to update payment status.');
      }
    } catch (err) {
      console.error('Error updating payment status', err);
    }
  };

  // Handle file uploads (Thumbnail, MP4 Video, QR Code)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'video' | 'qr') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(type);
    setVideoSuccessMsg('');
    setVideoErrorMsg('');
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', type === 'video' ? 'videos' : 'thumbnails');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    // Track real upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        // keep at 99% until backend completely processes (ImageKit cloud upload takes another split second)
        setUploadProgress(prev => ({ ...prev, [type]: Math.min(percentComplete, 99) }));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(prev => ({ ...prev, [type]: 100 }));
        try {
          const data = JSON.parse(xhr.responseText);
          
          if (type === 'thumbnail') {
            setVideoForm(prev => ({ ...prev, thumbnail_url: data.url }));
            setVideoSuccessMsg('Thumbnail uploaded successfully!');
          } else if (type === 'video') {
            setVideoForm(prev => ({ ...prev, video_url: data.url }));
            
            // If editing an existing video, save immediately to the Supabase videos table!
            if (editingVideoId) {
              try {
                const saveResponse = await fetch(`/api/admin/videos/${editingVideoId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'admin-key': adminKey
                  },
                  body: JSON.stringify({ ...videoForm, video_url: data.url })
                });
                if (saveResponse.ok) {
                  setVideoSuccessMsg('Video file uploaded and automatically saved to Supabase!');
                  loadData(); // reload catalog to get updated video url
                } else {
                  setVideoErrorMsg('File uploaded to ImageKit, but failed to auto-save to database.');
                }
              } catch (saveErr) {
                setVideoErrorMsg('Network error saving video URL to database.');
              }
            } else {
              setVideoSuccessMsg('Video file uploaded successfully to ImageKit! Click "Publish Stream" below to save this new stream to Supabase.');
            }
          } else if (type === 'qr' && settings) {
            setSettings(prev => prev ? { ...prev, qr_image: data.url } : null);
            setVideoSuccessMsg('QR Code uploaded successfully!');
          }
        } catch (err) {
          setVideoErrorMsg('Failed to parse upload response.');
        }
      } else {
        setVideoErrorMsg(`Upload failed with status: ${xhr.status}`);
      }
      setTimeout(() => {
        setUploadingField(null);
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      }, 1000);
    };

    xhr.onerror = () => {
      setVideoErrorMsg('Upload network error.');
      setTimeout(() => {
        setUploadingField(null);
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      }, 1000);
    };

    xhr.send(formData);
  };

  // Video Management (Create / Update)
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoErrorMsg('');
    setVideoSuccessMsg('');
    setIsSubmittingVideo(true);

    const endpoint = editingVideoId 
      ? `/api/admin/videos/${editingVideoId}` 
      : '/api/admin/videos';
    const method = editingVideoId ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'admin-key': adminKey
        },
        body: JSON.stringify(videoForm)
      });

      if (response.ok) {
        setVideoSuccessMsg(editingVideoId ? 'Video updated successfully!' : 'Video created successfully!');
        setVideoForm({
          title: '',
          description: '',
          thumbnail_url: '',
          video_url: '',
          price: 0,
          published: true
        });
        setEditingVideoId(null);
        loadData();
      } else {
        const errorData = await response.json();
        setVideoErrorMsg(errorData.error || 'Failed to submit video.');
      }
    } catch (err) {
      setVideoErrorMsg('Network submission error.');
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideoId(video.id);
    setVideoForm({
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      video_url: video.video_url,
      price: video.price,
      published: video.published
    });
    setVideoSuccessMsg('');
    setVideoErrorMsg('');
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this video? All related purchases will also be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: { 'admin-key': adminKey }
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Failed to delete video.');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleTogglePublish = async (video: Video) => {
    try {
      const response = await fetch(`/api/admin/videos/${video.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'admin-key': adminKey
        },
        body: JSON.stringify({ published: !video.published })
      });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Toggle error', err);
    }
  };

  // Global Settings update
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-key': adminKey
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        alert('Global platform settings updated successfully!');
        loadData();
      } else {
        alert('Failed to update settings.');
      }
    } catch (err) {
      console.error('Settings update error', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_key');
    setAdminKey('');
    setIsLoggedIn(false);
  };

  // ============================================
  // RENDERING SECTIONS
  // ============================================

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4" id="admin-login-wrapper">
        <div className="max-w-sm w-full bg-[#17212b] border border-[#24303f] rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl mb-3 border border-amber-500/20">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Secure Admin Area</h2>
            <p className="text-xs text-gray-400 mt-1">Please enter your secret administrator key passcode to gain access.</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4" id="admin-login-form">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin Secret Key</label>
              <input
                type="password"
                placeholder="Enter admin passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
                id="admin-passcode-input"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border border-[#24303f] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Back to Stream
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                id="admin-login-submit"
              >
                Log In Admin
              </button>
            </div>
          </form>

          <p className="text-[10px] text-gray-500 text-center mt-5">Default Passcode: <span className="font-mono text-gray-300 font-bold">admin123</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-dashboard-wrapper">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#17212b] border border-[#24303f] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Admin Console</h2>
            <p className="text-xs text-gray-400">Stream Management, Approval Board, and Global Variables</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none text-xs font-bold text-white bg-[#24303f] hover:bg-[#24303f]/80 px-4 py-2 rounded-xl transition border border-[#24303f]"
          >
            Stream Interface
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 sm:flex-none text-xs font-bold text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 px-4 py-2 rounded-xl transition"
            id="admin-logout-btn"
          >
            Log Out Console
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#17212b] p-1.5 rounded-xl border border-[#24303f]" id="admin-tabs">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'stats'
              ? 'bg-[#2481cc] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#24303f]/50'
          }`}
          id="admin-tab-stats"
        >
          <Users className="w-4 h-4" /> Approval & Statistics
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'videos'
              ? 'bg-[#2481cc] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#24303f]/50'
          }`}
          id="admin-tab-videos"
        >
          <VideoIcon className="w-4 h-4" /> Video Catalog Manager
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'purchases'
              ? 'bg-[#2481cc] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#24303f]/50'
          }`}
          id="admin-tab-purchases"
        >
          <CreditCard className="w-4 h-4" /> Purchases Log
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'settings'
              ? 'bg-[#2481cc] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#24303f]/50'
          }`}
          id="admin-tab-settings"
        >
          <Mail className="w-4 h-4" /> Global UPI Settings
        </button>
        <button
          onClick={() => setActiveTab('hosts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'hosts'
              ? 'bg-[#2481cc] text-white'
              : 'text-gray-400 hover:text-white hover:bg-[#24303f]/50'
          }`}
          id="admin-tab-hosts"
        >
          <Radio className="w-4 h-4" /> Host Management Console
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-t-transparent border-[#2481cc] rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* =======================================================
              SUBSECTION: STATS & APPROVALS
              ======================================================= */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6 animate-fade-in" id="admin-stats-tab">
              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#17212b] border border-[#24303f] p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Users</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2 font-mono">{stats.totalUsers}</h3>
                </div>

                <div className="bg-[#17212b] border border-[#24303f] p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Videos</span>
                    <VideoIcon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2 font-mono">{stats.totalVideos}</h3>
                </div>

                <div className="bg-[#17212b] border border-[#24303f] p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approved Sales</span>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2 font-mono">{stats.totalPurchases}</h3>
                </div>

                <div className="bg-[#17212b] border border-[#24303f] p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400 mt-2 font-mono">₹{stats.totalRevenue}</h3>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl relative overflow-hidden col-span-2 md:col-span-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pending Approvals</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-400 mt-2 font-mono">{stats.pendingPayments}</h3>
                </div>
              </div>

              {/* Pending Approvals Management Board */}
              <div className="bg-[#17212b] border border-[#24303f] rounded-2xl p-5" id="pending-approvals-board">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Pending UPI Direct Payments Approval Board</h3>
                </div>

                {purchases.filter(p => p.payment_status === 'pending').length === 0 ? (
                  <div className="py-8 text-center text-gray-500 border border-dashed border-[#24303f] rounded-xl">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-semibold text-emerald-400">All direct UPI payments cleared!</p>
                    <p className="text-[10px] mt-1">There are no pending purchase transactions currently.</p>
                  </div>
                ) : (
                  <div className="space-y-3" id="pending-approvals-list">
                    {purchases.filter(p => p.payment_status === 'pending').map((p) => (
                      <div 
                        key={p.id}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl gap-4 hover:border-amber-500/20 transition"
                        id={`pending-purchase-${p.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {p.first_name} {p.last_name} (@{p.username})
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">ID: {p.user_id}</span>
                          </div>
                          <p className="text-xs text-amber-400 font-medium mt-1">
                            Requested unlock: <span className="text-white underline">{p.video_title}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-gray-400">
                            <span className="bg-[#24303f] px-2 py-0.5 rounded font-bold">Amount: ₹{p.amount}</span>
                            <span>Transaction ID: <strong className="font-mono text-white text-xs">{p.transaction_id}</strong></span>
                            <span>Date: {new Date(p.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handlePaymentStatus(p.id, 'rejected')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition duration-150"
                            id={`reject-btn-${p.id}`}
                          >
                            <X className="w-3.5 h-3.5" /> Reject Payment
                          </button>
                          <button
                            onClick={() => handlePaymentStatus(p.id, 'approved')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition duration-150 shadow-md"
                            id={`approve-btn-${p.id}`}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve & Unlock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Registered Users Log */}
              <div className="bg-[#17212b] border border-[#24303f] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Latest Platform Registered Users</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#24303f] text-gray-400">
                        <th className="pb-2.5 font-bold">User</th>
                        <th className="pb-2.5 font-bold">User Email</th>
                        <th className="pb-2.5 font-bold">Username</th>
                        <th className="pb-2.5 font-bold">Joined On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24303f]/50">
                      {stats.latestUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#24303f]/20">
                          <td className="py-2.5 flex items-center gap-2.5">
                            <img src={u.profile_image} alt={u.first_name || u.username} className="w-7 h-7 rounded-full object-cover" />
                            <span className="font-medium text-white">{u.first_name || u.username} {u.last_name || ''}</span>
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-gray-400">{u.email || 'N/A'}</td>
                          <td className="py-2.5 text-[#2481cc] font-mono">@{u.username}</td>
                          <td className="py-2.5 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              SUBSECTION: VIDEO CATALOG MANAGER
              ======================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-6 animate-fade-in" id="admin-videos-tab">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to Add / Edit Video */}
                <div className="lg:col-span-1 bg-[#17212b] border border-[#24303f] rounded-2xl p-5 h-fit shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                    {editingVideoId ? <Edit2 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-[#2481cc]" />}
                    {editingVideoId ? 'Edit Video Catalog' : 'Upload New Video'}
                  </h3>

                  {videoSuccessMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {videoSuccessMsg}
                    </div>
                  )}

                  {videoErrorMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-rose-400 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {videoErrorMsg}
                    </div>
                  )}

                  <form onSubmit={handleVideoSubmit} className="space-y-4" id="video-catalog-form">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Video Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Advanced Telegram Monetization Secrets"
                        value={videoForm.title}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                        className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                        id="form-video-title"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        placeholder="Detailed video outline for user visibility..."
                        rows={3}
                        value={videoForm.description}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                        id="form-video-description"
                      />
                    </div>

                    {/* Thumbnail Image Picker & Upload */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Thumbnail Cover Image URL *</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={videoForm.thumbnail_url}
                          onChange={(e) => setVideoForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                          className="flex-1 px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                          id="form-video-thumbnail"
                        />
                        <label className="p-2 bg-[#24303f] hover:bg-[#24303f]/80 text-gray-300 rounded-xl cursor-pointer flex items-center justify-center border border-[#24303f] active:scale-95 transition-transform">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'thumbnail')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {uploadingField === 'thumbnail' && (
                        <div className="mt-1.5">
                          <div className="h-1 w-full bg-[#24303f] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2481cc] transition-all duration-200" style={{ width: `${uploadProgress.thumbnail || 0}%` }}></div>
                          </div>
                          <span className="text-[9px] text-[#2481cc] font-medium animate-pulse">Uploading cover... {uploadProgress.thumbnail || 0}%</span>
                        </div>
                      )}
                    </div>

                    {/* MP4 Video Picker & Upload */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">MP4 Video URL *</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={videoForm.video_url}
                          onChange={(e) => setVideoForm(prev => ({ ...prev, video_url: e.target.value }))}
                          required
                          className="flex-1 px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                          id="form-video-url"
                        />
                        <label className="p-2 bg-[#24303f] hover:bg-[#24303f]/80 text-gray-300 rounded-xl cursor-pointer flex items-center justify-center border border-[#24303f] active:scale-95 transition-transform">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => handleFileUpload(e, 'video')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {uploadingField === 'video' && (
                        <div className="mt-1.5">
                          <div className="h-1.5 w-full bg-[#24303f] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2481cc] transition-all duration-200" style={{ width: `${uploadProgress.video || 0}%` }}></div>
                          </div>
                          <span className="text-[9px] text-[#2481cc] font-medium animate-pulse">Uploading video to ImageKit... {uploadProgress.video || 0}%</span>
                        </div>
                      )}
                      <span className="text-[10px] text-gray-500 block mt-1 leading-normal">
                        Select an MP4 from local disk. It uploads directly to cloud storage. No local streaming weights.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unlock Price (INR) *</label>
                        <input
                          type="number"
                          placeholder="Price in ₹"
                          value={videoForm.price}
                          onChange={(e) => setVideoForm(prev => ({ ...prev, price: Math.max(0, Number(e.target.value)) }))}
                          required
                          className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                          id="form-video-price"
                        />
                        <span className="text-[9px] text-gray-500 mt-1 block">Set 0 to make it FREE immediately.</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                        <select
                          value={videoForm.published ? 'true' : 'false'}
                          onChange={(e) => setVideoForm(prev => ({ ...prev, published: e.target.value === 'true' }))}
                          className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                          id="form-video-published"
                        >
                          <option value="true">Published</option>
                          <option value="false">Hidden / Draft</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {editingVideoId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVideoId(null);
                            setVideoForm({
                              title: '',
                              description: '',
                              thumbnail_url: '',
                              video_url: '',
                              price: 0,
                              published: true
                            });
                          }}
                          className="flex-1 py-2 bg-[#24303f] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmittingVideo}
                        className="flex-1 py-2 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-xl text-xs font-bold transition shadow-md"
                        id="form-video-submit-btn"
                      >
                        {isSubmittingVideo ? 'Submitting...' : editingVideoId ? 'Save Edits' : 'Publish Video'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Video Catalog List Table */}
                <div className="lg:col-span-2 bg-[#17212b] border border-[#24303f] rounded-2xl p-5 shadow-xl h-fit">
                  <h3 className="text-sm font-bold text-white mb-4">Active Stream Catalog ({videos.length})</h3>

                  <div className="space-y-3" id="admin-video-list">
                    {videos.map((v) => (
                      <div 
                        key={v.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#24303f]/30 border border-[#24303f] rounded-xl gap-4 hover:bg-[#24303f]/50 transition duration-150"
                        id={`admin-video-item-${v.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={v.thumbnail_url}
                            alt={v.title}
                            className="w-16 h-11 object-cover rounded border border-[#24303f]"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{v.title}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              {v.price > 0 ? (
                                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                                  ₹{v.price}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                                  Free
                                </span>
                              )}
                              
                              <button
                                onClick={() => handleTogglePublish(v)}
                                className={`flex items-center gap-1.5 text-[10px] font-bold ${
                                  v.published 
                                    ? 'text-emerald-400 hover:text-emerald-300' 
                                    : 'text-gray-500 hover:text-gray-400'
                                }`}
                                title={v.published ? 'Click to Unpublish' : 'Click to Publish'}
                              >
                                {v.published ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" /> Published
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" /> Unpublished
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleEditVideo(v)}
                            className="p-2 bg-[#24303f] hover:bg-[#2481cc] text-gray-300 hover:text-white rounded-lg transition active:scale-95"
                            title="Edit"
                            id={`edit-video-${v.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(v.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition active:scale-95"
                            title="Delete"
                            id={`delete-video-${v.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =======================================================
              SUBSECTION: PURCHASES LOGS
              ======================================================= */}
          {activeTab === 'purchases' && (
            <div className="bg-[#17212b] border border-[#24303f] rounded-2xl p-5 shadow-xl animate-fade-in" id="admin-purchases-tab">
              <h3 className="text-sm font-bold text-white mb-4">Complete Purchase History logs</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#24303f] text-gray-400">
                      <th className="pb-3 font-bold">Transaction ID</th>
                      <th className="pb-3 font-bold">User details</th>
                      <th className="pb-3 font-bold">Purchased Stream</th>
                      <th className="pb-3 font-bold">Amount</th>
                      <th className="pb-3 font-bold">Payment Status</th>
                      <th className="pb-3 font-bold">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24303f]/50">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-[#24303f]/20">
                        <td className="py-3 font-mono text-[11px] text-gray-400 font-bold">{p.transaction_id}</td>
                        <td className="py-3">
                          <div className="font-semibold text-white">
                            {p.first_name} {p.last_name}
                          </div>
                          <span className="text-[10px] text-[#2481cc] font-mono">@{p.username}</span>
                        </td>
                        <td className="py-3 font-medium text-gray-200 truncate max-w-xs" title={p.video_title}>
                          {p.video_title}
                        </td>
                        <td className="py-3 font-bold text-emerald-400 font-mono">₹{p.amount}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            p.payment_status === 'approved' 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : p.payment_status === 'pending'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          }`}>
                            {p.payment_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 text-[11px] font-mono">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =======================================================
              SUBSECTION: GLOBAL SETTINGS
              ======================================================= */}
          {activeTab === 'settings' && settings && (
            <div className="max-w-xl bg-[#17212b] border border-[#24303f] rounded-2xl p-6 shadow-xl animate-fade-in" id="admin-settings-tab">
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-1.5">
                <Mail className="w-5 h-5 text-[#2481cc]" /> Global UPI Settings & Support Desk
              </h3>

              <form onSubmit={handleSettingsSubmit} className="space-y-5" id="global-settings-form">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Platform UPI ID *</label>
                  <input
                    type="text"
                    value={settings.upi_id}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, upi_id: e.target.value } : null)}
                    required
                    placeholder="e.g. business@upi"
                    className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                    id="settings-upi-id"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">This UPI ID is displayed on payment forms for manual QR Transfers.</span>
                </div>

                {/* QR Image Picker & Upload */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Payment QR Code Image URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={settings.qr_image}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, qr_image: e.target.value } : null)}
                      required
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                      id="settings-qr-image"
                    />
                    <label className="p-2 bg-[#24303f] hover:bg-[#24303f]/80 text-gray-300 rounded-xl cursor-pointer flex items-center justify-center border border-[#24303f] transition active:scale-95">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'qr')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploadingField === 'qr' && (
                    <div className="mt-1.5">
                      <div className="h-1 w-full bg-[#24303f] rounded-full overflow-hidden">
                        <div className="h-full bg-[#2481cc] transition-all duration-200" style={{ width: `${uploadProgress.qr || 0}%` }}></div>
                      </div>
                      <span className="text-[9px] text-[#2481cc] font-medium animate-pulse">Uploading QR... {uploadProgress.qr || 0}%</span>
                    </div>
                  )}
                  
                  {settings.qr_image && (
                    <div className="mt-3 p-2 bg-[#24303f]/20 border border-[#24303f] rounded-xl w-32">
                      <img src={settings.qr_image} alt="UPI QR Code preview" className="w-full aspect-square object-contain rounded" />
                      <span className="text-[9px] text-gray-400 text-center block mt-1">QR Preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Telegram Support *</label>
                  <input
                    type="text"
                    value={settings.support_email}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, support_email: e.target.value } : null)}
                    required
                    placeholder="@MeeCustomerservice"
                    className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                    id="settings-support-telegram"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">Telegram username or group link for support (e.g. @MeeCustomerservice).</span>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                  id="settings-submit-btn"
                >
                  <Save className="w-4 h-4" /> Save Global Settings
                </button>
              </form>
            </div>
          )}

          {activeTab === 'hosts' && (
            <div className="space-y-6 animate-fade-in" id="admin-hosts-tab">
              <AdminHostApplications adminKey={adminKey} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
