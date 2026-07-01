import React, { useState, useEffect } from 'react';
import { User, Purchase } from '../types';
import { Camera, Shield, FileVideo, History, AlertCircle, CheckCircle2, Clock, XCircle, LogOut, Sparkles, Radio } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onSelectVideo: (videoId: string) => void;
  onApplyHost?: () => void;
  onOpenHostDashboard?: () => void;
}

export default function UserProfile({ 
  user, 
  onLogout, 
  onUpdateUser, 
  onSelectVideo,
  onApplyHost,
  onOpenHostDashboard 
}: UserProfileProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch purchase history for this user
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingPurchases(true);
      try {
        const response = await fetch(`/api/purchases?user_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPurchases(data);
        }
      } catch (err) {
        console.error('Error fetching purchase history', err);
      } finally {
        setIsLoadingPurchases(false);
      }
    };
    fetchHistory();
  }, [user.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setSuccessMsg('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'profiles');

    try {
      // 1. Upload file to storage (ImageKit / local fallback)
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload server error');
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // 2. Update user profile in database
      const updateRes = await fetch('/api/profile/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          profile_image: imageUrl,
        }),
      });

      if (!updateRes.ok) {
        throw new Error('Database update error');
      }

      const updatedUser = await updateRes.json();
      onUpdateUser(updatedUser);
      setSuccessMsg('Profile picture updated successfully!');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: Purchase['payment_status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="user-profile-wrapper">
      {/* Left Card: Profile Details */}
      <div className="md:col-span-1 bg-[#17212b] border border-[#24303f] rounded-2xl p-6 shadow-xl text-center relative" id="user-profile-details">
        {/* Profile Pic Upload Section */}
        <div className="relative inline-block mx-auto mb-4">
          <img
            src={user.profile_image}
            alt={user.first_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#2481cc]/20 shadow-lg"
          />
          <label className="absolute bottom-0 right-0 p-1.5 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-full cursor-pointer shadow-md transition-transform active:scale-95" id="upload-profile-btn">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {isUploading && <p className="text-xs text-[#2481cc] animate-pulse mb-2 font-medium">Uploading image...</p>}
        {uploadError && <p className="text-xs text-rose-400 mb-2">{uploadError}</p>}
        {successMsg && <p className="text-xs text-emerald-400 mb-2">{successMsg}</p>}

        <h3 className="text-lg font-bold text-white tracking-tight">
          {user.first_name || user.username} {user.last_name || ''}
        </h3>
        <p className="text-xs text-[#2481cc] font-mono mt-0.5">@{user.username}</p>

        <div className="mt-5 pt-5 border-t border-[#24303f] text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-medium">User Email</span>
            <span className="text-gray-200 font-mono text-[11px]">{user.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-medium">Joined Platform</span>
            <span className="text-gray-200 font-mono text-[11px]">
              {new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </div>

        {user.role === 'host' ? (
          <button
            onClick={onOpenHostDashboard}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-xl text-xs font-bold transition duration-200 shadow shadow-[#2481cc]/25"
            id="host-dashboard-btn"
          >
            <Radio className="w-4 h-4" /> Host Dashboard
          </button>
        ) : (
          user.role !== 'admin' && (
            <button
              onClick={onApplyHost}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 rounded-xl text-xs font-bold transition duration-200"
              id="apply-host-btn"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Apply to Host
            </button>
          )
        )}

        <button
          onClick={onLogout}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition duration-200"
          id="logout-btn"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>

      {/* Right Card: Purchase History */}
      <div className="md:col-span-2 bg-[#17212b] border border-[#24303f] rounded-2xl p-6 shadow-xl" id="user-purchase-history">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-[#2481cc]" />
          <h3 className="text-base font-bold text-white tracking-tight">Your Video Library & Purchases</h3>
        </div>

        {isLoadingPurchases ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-t-transparent border-[#2481cc] rounded-full animate-spin"></div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-12 text-center text-gray-400 border border-dashed border-[#24303f] rounded-xl">
            <FileVideo className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <p className="text-xs">You have not initiated any purchases yet.</p>
            <p className="text-[10px] text-gray-500 mt-1">Select a premium video from the feed to purchase and unlock.</p>
          </div>
        ) : (
          <div className="space-y-4" id="purchase-history-list">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#24303f]/30 border border-[#24303f] rounded-xl hover:bg-[#24303f]/50 transition duration-150 gap-4"
                id={`purchase-item-${purchase.id}`}
              >
                <div className="flex items-center gap-3">
                  {purchase.video_thumbnail ? (
                    <img
                      src={purchase.video_thumbnail}
                      alt={purchase.video_title}
                      className="w-14 h-10 object-cover rounded border border-[#24303f]"
                    />
                  ) : (
                    <div className="w-14 h-10 bg-[#17212b] rounded flex items-center justify-center border border-[#24303f]">
                      <FileVideo className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{purchase.video_title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-semibold bg-[#24303f] px-2 py-0.5 rounded">
                        Price: ₹{purchase.amount}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        TXN: {purchase.transaction_id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  {getStatusBadge(purchase.payment_status)}
                  {purchase.payment_status === 'approved' && (
                    <button
                      onClick={() => onSelectVideo(purchase.video_id)}
                      className="text-[10px] font-bold text-white bg-[#2481cc] hover:bg-[#179cde] px-3 py-1 rounded-lg transition"
                      id={`play-unlocked-${purchase.video_id}`}
                    >
                      Watch Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
