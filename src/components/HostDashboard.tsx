import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, Users, DollarSign, MessageSquare, Send, Paperclip, Image, 
  Settings, Save, Upload, Loader, AlertCircle, FileText, Download, Check,
  Copy, Search, ShieldAlert, Shield, VolumeX, Volume2, Sparkles, TrendingUp,
  Wallet, ArrowRight, CreditCard, Info
} from 'lucide-react';
import { User, HostChatMessage, HostFollower, HostEarningsLog, WithdrawalRequest } from '../types';

interface HostDashboardProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
}

export default function HostDashboard({ user, onUpdateUser, onBack }: HostDashboardProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'stream' | 'followers' | 'earnings' | 'chat' | 'profile'>('stream');

  // Stream States
  const [isLive, setIsLive] = useState(user.is_live || false);
  const [liveThumbnail, setLiveThumbnail] = useState(user.live_thumbnail || '');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [streamSuccess, setStreamSuccess] = useState('');

  // Extended Stream Configurations (Advanced Streaming Tools)
  const [streamTitle, setStreamTitle] = useState('My Premium Livestream Event');
  const [streamDesc, setStreamDesc] = useState('Tune in for live premium commentary and QA!');
  const [streamCategory, setStreamCategory] = useState('Vlogging & Lifestyle');
  const [streamDelay, setStreamDelay] = useState<number>(0);
  const [streamQuality, setStreamQuality] = useState<string>('1080p');
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [isCopiedUrl, setIsCopiedUrl] = useState(false);
  const [streamKey] = useState<string>(() => 'live_' + Math.random().toString(36).substring(2, 10) + '_' + Math.random().toString(36).substring(2, 8));

  // Chat/Moderation Settings
  const [isSubscriberOnlyChat, setIsSubscriberOnlyChat] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isBlockExternalLinks, setIsBlockExternalLinks] = useState(false);

  // Profile States
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [profileImage, setProfileImage] = useState(user.profile_image || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Chat with Admin States
  const [messages, setMessages] = useState<HostChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'file' | undefined>(undefined);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Follower Management States
  const [followers, setFollowers] = useState<HostFollower[]>([]);
  const [followerSearch, setFollowerSearch] = useState('');
  const [isFollowersLoading, setIsFollowersLoading] = useState(false);
  const [followerError, setFollowerError] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  // Earnings Tracking States
  const [earningsLogs, setEarningsLogs] = useState<HostEarningsLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isEarningsLoading, setIsEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<string>('UPI');
  const [payoutDetails, setPayoutDetails] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll chat messages and unread counts
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchChatAndUnread = async () => {
      try {
        // Fetch Messages
        const msgRes = await fetch(`/api/host-chats/${user.id}`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData);
        }

        // Fetch Unread Count (sent by admin, so where is_admin is true or sender_id !== user.id)
        const unreadRes = await fetch(`/api/host-chats/${user.id}/unread?is_admin=false`);
        if (unreadRes.ok) {
          const countData = await unreadRes.json();
          setUnreadCount(countData.unreadCount);
        }
      } catch (err) {
        console.error('Error polling chat messages:', err);
      }
    };

    fetchChatAndUnread();
    interval = setInterval(fetchChatAndUnread, 3500); // poll every 3.5 seconds

    return () => clearInterval(interval);
  }, [user.id]);

  // Fetch Followers and Earnings when active tabs change
  useEffect(() => {
    if (activeTab === 'followers') {
      fetchFollowers();
    } else if (activeTab === 'earnings') {
      fetchEarningsAndWithdrawals();
    }
  }, [activeTab]);

  const fetchFollowers = async () => {
    setIsFollowersLoading(true);
    setFollowerError('');
    try {
      const res = await fetch(`/api/host-followers/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFollowers(data);
      } else {
        throw new Error('Failed to fetch followers.');
      }
    } catch (err: any) {
      setFollowerError(err.message || 'Failed to load followers list.');
    } finally {
      setIsFollowersLoading(false);
    }
  };

  const fetchEarningsAndWithdrawals = async () => {
    setIsEarningsLoading(true);
    setEarningsError('');
    try {
      const logRes = await fetch(`/api/host-earnings/${user.id}`);
      const wdRes = await fetch(`/api/host-withdrawals/${user.id}`);
      
      if (logRes.ok && wdRes.ok) {
        const logs = await logRes.json();
        const wds = await wdRes.json();
        setEarningsLogs(logs);
        setWithdrawals(wds);
      } else {
        throw new Error('Failed to load transaction data.');
      }
    } catch (err: any) {
      setEarningsError(err.message || 'Failed to load earnings stats.');
    } finally {
      setIsEarningsLoading(false);
    }
  };

  // Mark messages as read when transitioning to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && unreadCount > 0) {
      const markAsRead = async () => {
        try {
          await fetch(`/api/host-chats/${user.id}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_admin: false })
          });
          setUnreadCount(0);
        } catch (err) {
          console.error('Error marking chat as read:', err);
        }
      };
      markAsRead();
    }
  }, [activeTab, unreadCount, user.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Stream Toggle
  const handleToggleLive = async () => {
    setStreamError('');
    setStreamSuccess('');
    
    if (!liveThumbnail && !isLive) {
      setStreamError('Please upload a live stream thumbnail before starting the stream.');
      return;
    }

    const nextLiveState = !isLive;
    
    try {
      const res = await fetch(`/api/host-profile/${user.id}/live`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_live: nextLiveState,
          live_thumbnail: liveThumbnail
        })
      });

      if (!res.ok) throw new Error('Failed to update live stream status');

      const updatedUser = await res.json();
      setIsLive(updatedUser.is_live);
      onUpdateUser(updatedUser);
      setStreamSuccess(nextLiveState 
        ? `Your live stream "${streamTitle}" is now broadcasting live at ${streamQuality}!` 
        : 'Your live stream has been successfully terminated.'
      );
    } catch (err: any) {
      setStreamError(err.message || 'Error updating live stream status.');
    }
  };

  // Stream Config Save (Simulated feedback with success alerts)
  const handleSaveStreamConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setStreamSuccess('Live stream configuration and chat filters saved successfully!');
    setStreamError('');
  };

  // Thumbnail Upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setStreamError('');
    setStreamSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'live_thumbnails');

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload server error');

      const uploadData = await uploadRes.json();
      setLiveThumbnail(uploadData.url);
      
      // Update in profile
      await fetch(`/api/host-profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_thumbnail: uploadData.url })
      });

      setStreamSuccess('Stream thumbnail updated successfully!');
    } catch (err: any) {
      setStreamError(err.message || 'Failed to upload stream thumbnail.');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess('');

    try {
      const res = await fetch(`/api/host-profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          bio,
          profile_image: profileImage
        })
      });

      if (!res.ok) throw new Error('Failed to update profile');

      const updatedUser = await res.json();
      onUpdateUser(updatedUser);
      setProfileSuccess('Host profile updated successfully!');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Attachment Upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'chat_attachments');

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload error');

      const data = await uploadRes.json();
      setAttachmentUrl(data.url);
      setAttachmentName(file.name);
      
      const isImg = file.type.startsWith('image/');
      setAttachmentType(isImg ? 'image' : 'file');
    } catch (err) {
      console.error('Error uploading chat attachment:', err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() && !attachmentUrl) return;

    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/host-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: 'admin-maxwell', // Maxwell Blackey admin user id
          host_id: user.id,
          message_text: newMessageText,
          attachment_url: attachmentUrl || undefined,
          attachment_type: attachmentType || undefined,
          attachment_name: attachmentName || undefined
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessageText('');
        setAttachmentUrl('');
        setAttachmentName('');
        setAttachmentType(undefined);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Copy helpers
  const copyText = (text: string, type: 'key' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setIsCopiedKey(true);
      setTimeout(() => setIsCopiedKey(false), 2000);
    } else {
      setIsCopiedUrl(true);
      setTimeout(() => setIsCopiedUrl(false), 2000);
    }
  };

  // Toggle follower mute/ban status
  const handleToggleFollowerStatus = async (followerId: string, actionType: 'mute' | 'ban') => {
    const follower = followers.find(f => f.id === followerId);
    if (!follower) return;

    const updates: Partial<HostFollower> = {};
    if (actionType === 'mute') {
      updates.is_muted = !follower.is_muted;
    } else {
      updates.is_banned = !follower.is_banned;
    }

    try {
      const res = await fetch(`/api/host-followers/${user.id}/${followerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        const updated = await res.json();
        setFollowers(prev => prev.map(f => f.id === followerId ? updated : f));
      }
    } catch (err) {
      console.error('Failed to update follower status:', err);
    }
  };

  // Broadcast Notification Form Submit
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    setBroadcastSuccess('');
    try {
      const res = await fetch(`/api/host-followers/${user.id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage })
      });

      if (res.ok) {
        const data = await res.json();
        setBroadcastSuccess(data.message || 'Alert successfully broadcasted!');
        setBroadcastMessage('');
      } else {
        throw new Error('Failed to send broadcast notice.');
      }
    } catch (err: any) {
      setFollowerError(err.message || 'Could not dispatch broadcast.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Submit Withdrawal request
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setEarningsError('Please specify a positive withdrawal amount.');
      return;
    }

    const availableBalance = user.earnings ?? 0;
    if (amount > availableBalance) {
      setEarningsError(`Insufficient funds. Your available balance is $${availableBalance}.`);
      return;
    }

    if (!payoutDetails.trim()) {
      setEarningsError('Please fill in your payment details or address.');
      return;
    }

    setIsWithdrawing(true);
    setEarningsError('');
    setWithdrawalSuccess('');

    try {
      const res = await fetch(`/api/host-withdrawals/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          payout_method: payoutMethod,
          payout_details: payoutDetails
        })
      });

      if (res.ok) {
        const newWd = await res.json();
        setWithdrawals(prev => [newWd, ...prev]);
        
        // Update user local state
        const updatedUser = { ...user, earnings: Math.max(0, availableBalance - amount) };
        onUpdateUser(updatedUser);

        setWithdrawalSuccess(`Successfully requested withdrawal of $${amount}!`);
        setWithdrawAmount('');
        setPayoutDetails('');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error creating withdrawal.');
      }
    } catch (err: any) {
      setEarningsError(err.message || 'Withdrawal submission failed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Filter Followers client-side
  const filteredFollowers = followers.filter(f => 
    f.username.toLowerCase().includes(followerSearch.toLowerCase())
  );

  // Math helper for chart heights
  const maxEarn = earningsLogs.length > 0 ? Math.max(...earningsLogs.map(l => l.amount), 1) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6" id="host-dashboard-main">
      {/* Header Cards / Banner */}
      <div className="bg-gradient-to-r from-[#17212b]/95 to-[#24303f]/75 backdrop-blur-xl border border-[#24303f] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-rose-400' : 'bg-gray-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-rose-500' : 'bg-gray-500'}`}></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Host Studio Panel</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Welcome back, {user.first_name || user.username}</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-lg">Manage your streaming keys, control follower safety, audit earnings payouts, and communicate privately with portal executives.</p>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="bg-[#17212b] border border-[#24303f]/60 px-5 py-3 rounded-xl min-w-[140px] flex-1 md:flex-initial shadow-sm hover:border-[#2481cc]/40 transition duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Withdrawable</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline text-emerald-400 mt-1 gap-1">
              <span className="text-sm font-semibold">$</span>
              <span className="text-xl font-bold font-mono tracking-tight">{user.earnings ?? 0}</span>
            </div>
          </div>
          <div className="bg-[#17212b] border border-[#24303f]/60 px-5 py-3 rounded-xl min-w-[140px] flex-1 md:flex-initial shadow-sm hover:border-[#2481cc]/40 transition duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Audience</span>
              <Users className="w-3.5 h-3.5 text-[#2481cc]" />
            </div>
            <div className="flex items-baseline text-[#2481cc] mt-1 gap-1">
              <span className="text-xl font-bold font-mono tracking-tight">{user.followers ?? 0}</span>
              <span className="text-[10px] text-gray-500 font-bold ml-1">Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-[#24303f] scrollbar-none" id="host-dashboard-tabs">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 shrink-0 ${
            activeTab === 'stream' 
              ? 'border-[#2481cc] text-white bg-[#24303f]/15' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#24303f]/5'
          }`}
        >
          <Radio className="w-4 h-4" /> Broadcast Config
        </button>
        <button
          onClick={() => setActiveTab('followers')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 shrink-0 ${
            activeTab === 'followers' 
              ? 'border-[#2481cc] text-white bg-[#24303f]/15' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#24303f]/5'
          }`}
        >
          <Users className="w-4 h-4" /> Follower Management
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 shrink-0 ${
            activeTab === 'earnings' 
              ? 'border-[#2481cc] text-white bg-[#24303f]/15' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#24303f]/5'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Earnings & Payouts
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 relative shrink-0 ${
            activeTab === 'chat' 
              ? 'border-[#2481cc] text-white bg-[#24303f]/15' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#24303f]/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Chat with Admin
          {unreadCount > 0 && (
            <span className="absolute top-2 right-1.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 shrink-0 ${
            activeTab === 'profile' 
              ? 'border-[#2481cc] text-white bg-[#24303f]/15' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#24303f]/5'
          }`}
        >
          <Settings className="w-4 h-4" /> Customize Card
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-[#17212b] border border-[#24303f] rounded-2xl p-6 shadow-xl" id="host-dashboard-panels">
        
        {/* VIEW 1: LIVESTREAM CONTROL PANEL & ADVANCED CONFIGURATION */}
        {activeTab === 'stream' && (
          <div className="space-y-6" id="panel-stream">
            <div className="flex items-center justify-between border-b border-[#24303f]/50 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#2481cc]" />
                <h3 className="text-sm font-bold text-white tracking-tight">Broadcasting & Streaming Configuration</h3>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${isLive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' : 'bg-gray-500/10 text-gray-400 border border-gray-500/25'}`}>
                {isLive ? '● Live' : 'Offline'}
              </span>
            </div>

            {streamError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{streamError}</span>
              </div>
            )}

            {streamSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2 items-center animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{streamSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Stream Configurations */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSaveStreamConfig} className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#2481cc]" />
                    <span className="text-xs font-bold text-white">Livestream Info & Metadata</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stream Broadcast Title</label>
                      <input
                        type="text"
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        placeholder="e.g. DJ Club Night Live Mix"
                        className="w-full px-3 py-2 text-xs bg-[#17212b] border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Streaming Category</label>
                      <select
                        value={streamCategory}
                        onChange={(e) => setStreamCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#17212b] border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                      >
                        <option>Music & Entertainment</option>
                        <option>Q&A / Podcast Session</option>
                        <option>Vlogging & Lifestyle</option>
                        <option>Gaming & Esports</option>
                        <option>Premium Private Workshop</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stream Event Description</label>
                    <textarea
                      value={streamDesc}
                      onChange={(e) => setStreamDesc(e.target.value)}
                      placeholder="Add a detailed description for viewers who open your broadcast..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-[#17212b] border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quality Resolution Limit</label>
                      <select
                        value={streamQuality}
                        onChange={(e) => setStreamQuality(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#17212b] border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                      >
                        <option value="1080p">1080p Full HD (60 FPS)</option>
                        <option value="720p">720p HD (60 FPS)</option>
                        <option value="480p">480p SD (30 FPS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Streaming Delay Protection</label>
                      <select
                        value={streamDelay}
                        onChange={(e) => setStreamDelay(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-[#17212b] border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                      >
                        <option value={0}>Normal (Zero Delay)</option>
                        <option value={5}>5 Seconds Delay</option>
                        <option value={10}>10 Seconds Delay</option>
                        <option value={30}>30 Seconds Delay (High Quality Buffer)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#24303f] hover:bg-[#24303f]/80 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border border-[#24303f]"
                    >
                      <Save className="w-3.5 h-3.5 text-[#2481cc]" /> Update Metadata
                    </button>
                  </div>
                </form>

                {/* Stream Server Keys Setup */}
                <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-white">Stream Keys & RTMP Ingest URL</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Use these ingest details inside streaming tools like OBS Studio, Streamlabs, or vMix to stream directly to the portal server.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RTMP Server Ingest URL</span>
                        <button
                          onClick={() => copyText('rtmp://live.portalstreaming.io/app', 'url')}
                          className="text-[10px] font-bold text-[#2481cc] hover:text-[#179cde] flex items-center gap-1"
                        >
                          {isCopiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {isCopiedUrl ? 'Copied' : 'Copy URL'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value="rtmp://live.portalstreaming.io/app"
                        readOnly
                        className="w-full px-3 py-1.5 text-[10px] font-mono bg-[#17212b] border border-[#24303f] rounded-lg text-gray-400 focus:outline-none select-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stream Key (Keep Private)</span>
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/15 px-1 rounded">Hidden</span>
                        </div>
                        <button
                          onClick={() => copyText(streamKey, 'key')}
                          className="text-[10px] font-bold text-[#2481cc] hover:text-[#179cde] flex items-center gap-1"
                        >
                          {isCopiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {isCopiedKey ? 'Copied' : 'Copy Key'}
                        </button>
                      </div>
                      <input
                        type="password"
                        value={streamKey}
                        readOnly
                        className="w-full px-3 py-1.5 text-[10px] font-mono bg-[#17212b] border border-[#24303f] rounded-lg text-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Thumbnail & Broadcast Status Toggle */}
              <div className="space-y-6">
                {/* Live Thumbnail Selection */}
                <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5 space-y-3">
                  <span className="block text-xs font-bold text-white">Live Broadcast Thumbnail</span>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    This thumbnail is displayed on the main home portal to grab user attention while you are broadcasting.
                  </p>
                  
                  {liveThumbnail ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-[#24303f] bg-black">
                      <img src={liveThumbnail} alt="Live Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <label className="px-3 py-1.5 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-lg text-[10px] font-bold cursor-pointer transition">
                          Change Image
                          <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg border-2 border-dashed border-[#24303f] flex flex-col items-center justify-center text-gray-500 bg-[#17212b]/50">
                      <Upload className="w-6 h-6 mb-2 text-gray-600" />
                      <label className="px-3 py-1.5 bg-[#2481cc]/15 hover:bg-[#2481cc]/25 text-[#2481cc] rounded-lg text-[10px] font-bold cursor-pointer transition">
                        Upload Thumbnail
                        <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                      </label>
                    </div>
                  )}

                  {isUploadingThumbnail && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-[#2481cc] font-medium animate-pulse">
                      <Loader className="w-3.5 h-3.5 animate-spin" /> Uploading image to CDN...
                    </div>
                  )}
                </div>

                {/* Broadcast Chat filters & Moderation */}
                <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-4 h-4 text-[#2481cc]" />
                    <span className="text-xs font-bold text-white">Live Chat Moderation Tools</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white transition">Subscriber-only Chat</span>
                        <span className="text-[9px] text-gray-500">Only premium members can chat live</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSubscriberOnlyChat}
                        onChange={() => setIsSubscriberOnlyChat(!isSubscriberOnlyChat)}
                        className="rounded bg-[#17212b] border-[#24303f] text-[#2481cc] focus:ring-0 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white transition">Chat Slow Mode (5s)</span>
                        <span className="text-[9px] text-gray-500">Limits user messaging frequency</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isSlowMode}
                        onChange={() => setIsSlowMode(!isSlowMode)}
                        className="rounded bg-[#17212b] border-[#24303f] text-[#2481cc] focus:ring-0 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white transition">Block External Links</span>
                        <span className="text-[9px] text-gray-500">Instantly deletes link spam in chat</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isBlockExternalLinks}
                        onChange={() => setIsBlockExternalLinks(!isBlockExternalLinks)}
                        className="rounded bg-[#17212b] border-[#24303f] text-[#2481cc] focus:ring-0 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                {/* State Trigger Button */}
                <div className="bg-[#24303f]/30 border border-[#24303f] rounded-xl p-5 space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Broadcasting Switch</span>
                    <span className={`text-xs font-bold block mt-1 ${isLive ? 'text-rose-500' : 'text-gray-400'}`}>
                      {isLive ? '● Live on Home Feed' : 'Offline Mode'}
                    </span>
                  </div>

                  <button
                    onClick={handleToggleLive}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      isLive 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                        : 'bg-[#2481cc] hover:bg-[#179cde] text-white shadow-[#2481cc]/25'
                    }`}
                  >
                    <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
                    {isLive ? 'Stop Broadcast Feed' : 'Launch Live Broadcast'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FOLLOWER MANAGEMENT MODERATION CONTROL */}
        {activeTab === 'followers' && (
          <div className="space-y-6 animate-fade-in" id="panel-followers">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#24303f]/50 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2481cc]" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Host Audience & Follower Management</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Audit followed users, restrict toxic audience chat privileges, or send push messages.</p>
                </div>
              </div>

              {/* Search follower */}
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search followers..."
                  value={followerSearch}
                  onChange={(e) => setFollowerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-[#17212b] border border-[#24303f] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                />
              </div>
            </div>

            {followerError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {followerError}
              </div>
            )}

            {broadcastSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2 items-center animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Main List Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-white">Active Follower Base ({filteredFollowers.length})</span>
                    <button 
                      onClick={fetchFollowers} 
                      className="text-[10px] text-gray-500 hover:text-[#2481cc] font-semibold transition"
                    >
                      Reload List
                    </button>
                  </div>

                  {isFollowersLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                      <Loader className="w-7 h-7 animate-spin text-[#2481cc] mb-2" />
                      <p className="text-xs">Synchronizing follower directory...</p>
                    </div>
                  ) : filteredFollowers.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs font-bold">No followers found</p>
                      <p className="text-[10px] text-gray-600 mt-1">If this is a new account, followers will appear once users join your channel.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#24303f]/40 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                      {filteredFollowers.map((fol) => (
                        <div key={fol.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 group">
                          <div className="flex items-center gap-3">
                            <img
                              src={fol.profile_image}
                              alt={fol.username}
                              className="w-9 h-9 rounded-full bg-[#17212b] object-cover border border-[#24303f]"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">@{fol.username}</span>
                                {fol.is_banned && (
                                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/15 text-[8px] font-bold px-1.5 rounded">Banned</span>
                                )}
                                {fol.is_muted && !fol.is_banned && (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/15 text-[8px] font-bold px-1.5 rounded">Muted</span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500 block">
                                Followed: {new Date(fol.followed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* Quick Moderation Controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleFollowerStatus(fol.id, 'mute')}
                              disabled={fol.is_banned}
                              title={fol.is_muted ? 'Unmute chat' : 'Mute chat'}
                              className={`p-1.5 rounded-lg border text-xs transition duration-200 ${
                                fol.is_muted 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
                                  : 'bg-[#17212b] text-gray-400 border-[#24303f] hover:text-white hover:bg-[#24303f] disabled:opacity-30'
                              }`}
                            >
                              {fol.is_muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleToggleFollowerStatus(fol.id, 'ban')}
                              title={fol.is_banned ? 'Revoke Ban' : 'Ban from Channel'}
                              className={`p-1.5 rounded-lg border text-xs transition duration-200 ${
                                fol.is_banned 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
                                  : 'bg-[#17212b] text-gray-400 border-[#24303f] hover:text-white hover:bg-[#24303f]'
                              }`}
                            >
                              {fol.is_banned ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Broadcast Alert Tool */}
              <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2481cc]" />
                  <span className="text-xs font-bold text-white">Broadcast Announcement</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Write a message to trigger an instant browser push notice and a feed banner for all online followers notifying them of updates.
                </p>

                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="e.g. Streaming in 10 minutes! Make sure to tune in..."
                    rows={4}
                    className="w-full px-3 py-2 text-xs bg-[#17212b] border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition resize-none placeholder-gray-600"
                    required
                  />

                  <button
                    type="submit"
                    disabled={isBroadcasting || !broadcastMessage.trim()}
                    className="w-full py-2 bg-[#2481cc] hover:bg-[#179cde] disabled:bg-[#2481cc]/40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                  >
                    {isBroadcasting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Broadcast to Audience
                  </button>
                </form>

                <div className="p-3 bg-[#24303f]/20 rounded-lg text-[10px] text-gray-500 border border-[#24303f]/40 flex gap-2 items-start leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-[#2481cc] shrink-0 mt-0.5" />
                  <span>Broadcast notices adhere to anti-spam protocols and are archived for moderation audits.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: EARNINGS TRACKING, CHARTING, AND WITHDRAWALS */}
        {activeTab === 'earnings' && (
          <div className="space-y-6 animate-fade-in" id="panel-earnings">
            <div className="flex items-center justify-between border-b border-[#24303f]/50 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Earnings Tracking & Payout Console</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tally tips, subscriptions, video sales revenues, and request payment withdrawals.</p>
                </div>
              </div>
            </div>

            {earningsError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {earningsError}
              </div>
            )}

            {withdrawalSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2 items-center animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{withdrawalSuccess}</span>
              </div>
            )}

            {isEarningsLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-500">
                <Loader className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <p className="text-xs font-medium">Synchronizing ledger and transactions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Visual Chart & Log Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Visual Chart using native SVG bar graphs */}
                  <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5">
                    <span className="block text-xs font-bold text-white mb-4">Ledger Analytics: Daily Earnings Trend</span>
                    
                    {earningsLogs.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-gray-600 text-[11px]">
                        No daily log metrics available.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Native High-Quality SVG Bar graph */}
                        <div className="h-40 w-full flex items-end justify-between gap-2.5 pt-4 px-2">
                          {earningsLogs.slice(0, 7).reverse().map((log, idx) => {
                            const barHeightPct = (log.amount / maxEarn) * 85;
                            return (
                              <div key={log.id} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                                {/* Hover Tooltip */}
                                <div className="absolute -top-10 bg-gray-900 border border-[#24303f] text-white text-[9px] font-mono rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 text-center min-w-[70px]">
                                  <span className="block font-bold">${log.amount}</span>
                                  <span className="text-[8px] text-gray-400 capitalize">{log.source.replace('_', ' ')}</span>
                                </div>
                                
                                {/* Bar */}
                                <div 
                                  className="w-full bg-emerald-500/15 group-hover:bg-emerald-400/35 border-t border-emerald-400/40 rounded-t transition-all duration-500 ease-out"
                                  style={{ height: `${Math.max(barHeightPct, 6)}%` }}
                                ></div>

                                {/* Label */}
                                <span className="text-[8px] text-gray-500 mt-2 font-mono truncate max-w-full">
                                  {new Date(log.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Revenue Streams Proportional bar */}
                        <div className="pt-3 border-t border-[#24303f]/60">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Revenue Streams split</span>
                          <div className="h-2 w-full rounded-full bg-gray-800 flex overflow-hidden">
                            <div className="bg-emerald-400" style={{ width: '45%' }} title="Livestream Tips: 45%"></div>
                            <div className="bg-[#2481cc]" style={{ width: '35%' }} title="Video Purchases: 35%"></div>
                            <div className="bg-amber-500" style={{ width: '20%' }} title="Premium Fans: 20%"></div>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live Tips (45%)
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-[#2481cc]"></span> Video Purchases (35%)
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Subscriptions (20%)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transaction Ledger list */}
                  <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5">
                    <span className="block text-xs font-bold text-white mb-4">Recent Inbound Transactions</span>
                    
                    {earningsLogs.length === 0 ? (
                      <div className="py-8 text-center text-gray-600 text-xs">
                        No transactions registered yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#24303f]/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider pb-2">
                              <th className="pb-2">User / Description</th>
                              <th className="pb-2">Source</th>
                              <th className="pb-2">Date</th>
                              <th className="pb-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#24303f]/30 text-xs text-gray-300">
                            {earningsLogs.map((log) => (
                              <tr key={log.id} className="group hover:bg-[#24303f]/5 transition">
                                <td className="py-2.5 pr-2">
                                  <div className="font-semibold text-white">@{log.username || 'fan'}</div>
                                  <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{log.description}</div>
                                </td>
                                <td className="py-2.5">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono capitalize ${
                                    log.source === 'stream_tip' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                      : log.source === 'video_purchase' 
                                        ? 'bg-[#2481cc]/10 text-[#2481cc] border border-[#2481cc]/10' 
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                  }`}>
                                    {log.source.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2.5 text-[10px] text-gray-500 font-mono">
                                  {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-2.5 text-right font-bold font-mono text-emerald-400">+${log.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Withdrawal Setup & History */}
                <div className="space-y-6">
                  {/* Withdraw Funds Panel */}
                  <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white font-mono">Payout Request Tool</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Withdraw your cleared available balance. Enter your desired sum and UPI address to submit a settlement.
                    </p>

                    <form onSubmit={handleWithdrawalSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Withdrawable Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">$</span>
                          <input
                            type="number"
                            placeholder="e.g. 100"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            min={1}
                            max={user.earnings ?? 0}
                            className="w-full pl-7 pr-16 py-1.5 bg-[#17212b] border border-[#24303f] rounded-xl text-xs text-white focus:outline-none focus:border-[#2481cc] transition font-mono font-bold"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setWithdrawAmount(String(user.earnings ?? 0))}
                            className="absolute right-2 top-1 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 text-[9px] font-bold transition"
                          >
                            All
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payout Gateway</label>
                          <select
                            value={payoutMethod}
                            onChange={(e) => setPayoutMethod(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#17212b] border border-[#24303f] rounded-xl text-[10px] text-white focus:outline-none focus:border-[#2481cc] transition"
                          >
                            <option value="UPI">UPI (Unified Pay)</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="PayPal">PayPal Email</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payout Address</label>
                          <input
                            type="text"
                            placeholder={payoutMethod === 'UPI' ? 'name@upi' : payoutMethod === 'PayPal' ? 'name@email.com' : 'Acc Number'}
                            value={payoutDetails}
                            onChange={(e) => setPayoutDetails(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#17212b] border border-[#24303f] rounded-xl text-[10px] text-white focus:outline-none focus:border-[#2481cc] transition font-mono"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0 || (user.earnings ?? 0) <= 0}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/20 disabled:text-gray-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow shadow-emerald-500/10"
                      >
                        {isWithdrawing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                        Request Settlement
                      </button>
                    </form>
                  </div>

                  {/* Payout Requests History List */}
                  <div className="bg-[#24303f]/15 border border-[#24303f] rounded-xl p-5 space-y-3">
                    <span className="block text-xs font-bold text-white font-mono">Withdrawal History Log</span>
                    
                    {withdrawals.length === 0 ? (
                      <p className="text-[10px] text-gray-500 py-3 text-center">No historic withdrawals registered.</p>
                    ) : (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                        {withdrawals.map((wd) => (
                          <div key={wd.id} className="p-3 bg-[#17212b] border border-[#24303f]/60 rounded-xl text-xs flex justify-between items-center hover:border-gray-700 transition">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-white font-mono">${wd.amount}</span>
                                <span className="text-[9px] text-gray-500 font-mono">({wd.payout_method})</span>
                              </div>
                              <span className="text-[9px] text-gray-500 block font-mono truncate max-w-[120px]">{wd.payout_details}</span>
                            </div>

                            <div className="text-right">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize ${
                                wd.status === 'approved' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                                  : wd.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/15 animate-pulse'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
                              }`}>
                                {wd.status}
                              </span>
                              <span className="text-[8px] text-gray-500 block mt-1 font-mono">
                                {new Date(wd.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: PRIVATE ADMIN CHAT INTERFACE */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[500px] animate-fade-in" id="panel-chat">
            <div className="flex items-center justify-between border-b border-[#24303f]/50 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#2481cc]" />
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">Private Line with Portal Administrator</h3>
                  <p className="text-[9px] text-gray-400 mt-0.5">Secure operations desk chat. Messages are encrypted and stored.</p>
                </div>
              </div>
              <div className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded">
                ● Online
              </div>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin" id="host-chat-scroller">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-gray-500">
                  <MessageSquare className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-xs">Your private chat history is empty.</p>
                  <p className="text-[10px] text-gray-600 mt-1">Send a greeting message to start conversations with the admin.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      {/* Bubble */}
                      <div className={`p-3 rounded-xl text-xs relative ${
                        isOwn 
                          ? 'bg-[#2481cc] text-white rounded-tr-none shadow shadow-[#2481cc]/20' 
                          : 'bg-[#24303f]/75 text-gray-200 rounded-tl-none border border-[#24303f]'
                      }`}>
                        {/* Attachment display */}
                        {msg.attachment_url && (
                          <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-black/10">
                            {msg.attachment_type === 'image' ? (
                              <img src={msg.attachment_url} alt="Attachment" className="max-h-40 object-cover rounded-lg" referrerPolicy="no-referrer" />
                            ) : (
                              <a 
                                href={msg.attachment_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 bg-black/15 hover:bg-black/25 text-white transition text-[10px] font-mono"
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="truncate">{msg.attachment_name || 'Attached File'}</span>
                                <Download className="w-3 h-3 shrink-0" />
                              </a>
                            )}
                          </div>
                        )}

                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[9px] text-gray-500 mt-1 font-mono">
                        {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Form / Attachment Drawer */}
            <form onSubmit={handleSendMessage} className="border-t border-[#24303f] pt-4 mt-3">
              {attachmentUrl && (
                <div className="mb-3 p-2 bg-[#24303f]/55 border border-[#24303f] rounded-xl flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center gap-2 truncate">
                    {attachmentType === 'image' ? <Image className="w-4 h-4 text-[#2481cc]" /> : <FileText className="w-4 h-4 text-amber-500" />}
                    <span className="truncate font-mono text-[10px]">{attachmentName || 'Attached Upload'}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setAttachmentUrl(''); setAttachmentName(''); setAttachmentType(undefined); }}
                    className="text-rose-400 hover:text-rose-500 text-[10px] font-bold px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/15"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 relative">
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment || isSendingMessage}
                  className="p-2.5 bg-[#24303f]/50 hover:bg-[#24303f] text-gray-400 hover:text-white rounded-xl transition border border-[#24303f]"
                >
                  {isUploadingAttachment ? <Loader className="w-4 h-4 animate-spin text-[#2481cc]" /> : <Paperclip className="w-4 h-4" />}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAttachmentUpload} 
                  className="hidden" 
                />

                <input
                  type="text"
                  placeholder="Type a secure message for portal managers..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  disabled={isSendingMessage}
                  className="flex-1 bg-[#24303f]/50 border border-[#24303f] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
                />

                <button
                  type="submit"
                  disabled={isSendingMessage || isUploadingAttachment || (!newMessageText.trim() && !attachmentUrl)}
                  className="p-2.5 bg-[#2481cc] hover:bg-[#179cde] disabled:bg-[#2481cc]/40 text-white rounded-xl transition shadow shadow-[#2481cc]/25"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 5: HOST PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5 animate-fade-in" id="panel-profile">
            <div className="flex items-center gap-2 pb-2 border-b border-[#24303f]/40">
              <Settings className="w-5 h-5 text-[#2481cc]" />
              <h3 className="text-sm font-bold text-white tracking-tight">Host Public Profile Configuration</h3>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-fade-in">
                {profileSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Host Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief bio that will show on your profile card..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Public Profile Image URL</label>
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] transition font-mono text-[10px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 bg-[#2481cc] hover:bg-[#179cde] disabled:bg-[#2481cc]/50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow shadow-[#2481cc]/20 cursor-pointer"
            >
              {isSavingProfile ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
            </button>
          </form>
        )}
      </div>

      {/* Return Button */}
      <div className="text-center pt-2">
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-white transition cursor-pointer"
        >
          Return to Profile
        </button>
      </div>
    </div>
  );
}
