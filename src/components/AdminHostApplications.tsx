import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, X, Trash2, Calendar, Mail, FileText, HelpCircle, User, MessageSquare, 
  Send, Paperclip, Image, Download, Loader, AlertCircle, RefreshCw 
} from 'lucide-react';
import { HostApplication, HostChatMessage, User as UserType } from '../types';

interface AdminHostApplicationsProps {
  adminKey: string;
}

export default function AdminHostApplications({ adminKey }: AdminHostApplicationsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'chats'>('applications');
  
  // Applications States
  const [applications, setApplications] = useState<HostApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appError, setAppError] = useState('');
  const [appSuccess, setAppSuccess] = useState('');

  // Chat Room States
  const [hostsList, setHostsList] = useState<UserType[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HostChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'file' | undefined>(undefined);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Host Applications
  const fetchApplications = async () => {
    setLoadingApps(true);
    setAppError('');
    try {
      const response = await fetch('/api/admin/host-applications', {
        headers: { 'admin-key': adminKey }
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        throw new Error('Failed to load host applications.');
      }
    } catch (err: any) {
      setAppError(err.message || 'Error loading applications.');
    } finally {
      setLoadingApps(false);
    }
  };

  // Fetch approved hosts for chat list
  const fetchHostsList = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'admin-key': adminKey }
      });
      if (response.ok) {
        const stats = await response.json();
        // filter hosts or all users that has application
        const allUsers: UserType[] = stats.latestUsers || [];
        const hosts = allUsers.filter(u => u.role === 'host' || u.id === 'admin-maxwell');
        
        // Also ensure any users who submitted application or sent a message exist in list
        const uniqueHostIds = new Set(hosts.map(h => h.id));
        const finalHosts = [...hosts];
        
        // Fetch all current users if needed, or query from database
        const usersRes = await fetch('/api/purchases?user_id='); // generic way, or just fetch all users from backend
        // Let's fallback to filtering users that are in applications
        applications.forEach(app => {
          if (!uniqueHostIds.has(app.user_id)) {
            uniqueHostIds.add(app.user_id);
            finalHosts.push({
              id: app.user_id,
              username: app.telegram_username || app.email.split('@')[0],
              first_name: app.full_name,
              last_name: '',
              email: app.email,
              profile_image: app.profile_photo_url,
              created_at: app.created_at,
              role: 'user'
            });
          }
        });

        // Remove actual admin from final hosts list
        const filteredList = finalHosts.filter(h => h.id !== 'admin-maxwell');
        setHostsList(filteredList);
      }
    } catch (err) {
      console.error('Error fetching hosts list for chat:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'chats') {
      fetchHostsList();
    }
  }, [activeSubTab, applications]);

  // Poll current chat room & unread counts for all hosts
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollChatData = async () => {
      // 1. If chat tab is open, fetch messages for selected room
      if (activeSubTab === 'chats' && selectedHostId) {
        try {
          const res = await fetch(`/api/host-chats/${selectedHostId}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
          }
        } catch (err) {
          console.error('Error polling chat messages:', err);
        }
      }

      // 2. Poll unread counts for all hosts in lists
      if (activeSubTab === 'chats' && hostsList.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(hostsList.map(async (host) => {
          try {
            const res = await fetch(`/api/host-chats/${host.id}/unread?is_admin=true`);
            if (res.ok) {
              const countData = await res.json();
              counts[host.id] = countData.unreadCount;
            }
          } catch (err) {
            console.error('Error polling unread for host:', host.id, err);
          }
        }));
        setUnreadCounts(counts);
      }
    };

    pollChatData();
    interval = setInterval(pollChatData, 3500); // Poll every 3.5s

    return () => clearInterval(interval);
  }, [activeSubTab, selectedHostId, hostsList]);

  // Mark room as read upon selection
  useEffect(() => {
    if (selectedHostId && activeSubTab === 'chats') {
      const markAsRead = async () => {
        try {
          await fetch(`/api/host-chats/${selectedHostId}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_admin: true })
          });
          setUnreadCounts(prev => ({ ...prev, [selectedHostId]: 0 }));
        } catch (err) {
          console.error('Error marking room as read:', err);
        }
      };
      markAsRead();
    }
  }, [selectedHostId, activeSubTab]);

  // Scroll to bottom of active room
  useEffect(() => {
    if (selectedHostId && activeSubTab === 'chats') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Application Approval/Rejection
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setAppSuccess('');
    setAppError('');
    try {
      const response = await fetch(`/api/admin/host-applications/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'admin-key': adminKey
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setAppSuccess(`Application has been successfully ${status}!`);
        fetchApplications();
      } else {
        const err = await response.json();
        throw new Error(err.error || `Failed to update status to ${status}`);
      }
    } catch (err: any) {
      setAppError(err.message || 'Error processing status update.');
    }
  };

  // Handle Delete Application
  const handleDeleteApplication = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this application?')) return;
    setAppSuccess('');
    setAppError('');
    try {
      const response = await fetch(`/api/admin/host-applications/${id}`, {
        method: 'DELETE',
        headers: { 'admin-key': adminKey }
      });

      if (response.ok) {
        setAppSuccess('Application deleted successfully.');
        fetchApplications();
      } else {
        throw new Error('Failed to delete application.');
      }
    } catch (err: any) {
      setAppError(err.message || 'Error deleting application.');
    }
  };

  // Handle Send Chat Reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostId || (!newMessageText.trim() && !attachmentUrl)) return;

    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/host-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: 'admin-maxwell', // Maxwell Blackey admin id
          receiver_id: selectedHostId,
          host_id: selectedHostId,
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
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Upload Attachment
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

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => (sum as number) + (count as number), 0) as number;

  return (
    <div className="space-y-6" id="admin-host-console">
      {/* Console Sub Tabs */}
      <div className="flex bg-[#24303f]/30 p-1.5 rounded-xl border border-[#24303f] w-max">
        <button
          onClick={() => setActiveSubTab('applications')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'applications' 
              ? 'bg-[#2481cc] text-white shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Host Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveSubTab('chats')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'chats' 
              ? 'bg-[#2481cc] text-white shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Host Chats
          {totalUnread > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* VIEW A: HOST APPLICATIONS LIST */}
      {activeSubTab === 'applications' && (
        <div className="space-y-4" id="applications-subview">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted Host Applications</h3>
            <button 
              onClick={fetchApplications} 
              disabled={loadingApps}
              className="p-1.5 bg-[#24303f]/50 hover:bg-[#24303f] border border-[#24303f] text-gray-400 hover:text-white rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingApps ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {appError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{appError}</span>
            </div>
          )}

          {appSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2 items-center">
              <Check className="w-4 h-4 shrink-0" />
              <span>{appSuccess}</span>
            </div>
          )}

          {loadingApps ? (
            <div className="py-16 text-center">
              <Loader className="w-8 h-8 animate-spin text-[#2481cc] mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-medium">Retrieving host applications roster...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#24303f] rounded-2xl bg-[#24303f]/10">
              <User className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bold">No Applications Registered</p>
              <p className="text-[10px] text-gray-500 mt-1">Pending user submissions will automatically list in this queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-[#17212b]/95 border border-[#24303f] rounded-2xl p-5 md:p-6 shadow-xl relative flex flex-col md:flex-row gap-6 items-start"
                  id={`app-card-${app.id}`}
                >
                  {/* Photo Column */}
                  <div className="shrink-0 text-center mx-auto md:mx-0">
                    <img 
                      src={app.profile_photo_url} 
                      alt={app.full_name} 
                      className="w-20 h-20 rounded-full object-cover border border-[#2481cc]/20 bg-[#24303f]"
                    />
                    <span className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      app.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      app.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Details Column */}
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{app.full_name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Application ID: {app.id}</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#24303f]/15 p-3 rounded-xl border border-[#24303f]/30">
                      <div className="text-[11px]">
                        <span className="block text-gray-500 font-bold">Age / Gender</span>
                        <span className="text-gray-300">{app.age} Yrs old ({app.gender})</span>
                      </div>
                      <div className="text-[11px] truncate">
                        <span className="block text-gray-500 font-bold">Contact Email</span>
                        <span className="text-gray-300 font-mono truncate block">{app.email}</span>
                      </div>
                      <div className="text-[11px]">
                        <span className="block text-gray-500 font-bold">Telegram Username</span>
                        <span className="text-[#2481cc] font-semibold">{app.telegram_username ? `@${app.telegram_username}` : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Experience Box */}
                    <div className="space-y-1 bg-[#24303f]/25 p-3 rounded-xl border border-[#24303f]/35">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5 text-[#2481cc]" /> Hosting / Streaming Experience
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{app.experience}</p>
                    </div>

                    {/* Reason Box */}
                    <div className="space-y-1 bg-[#24303f]/25 p-3 rounded-xl border border-[#24303f]/35">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> Purpose / Why join?
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{app.why_host}</p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex justify-between items-center pt-2 border-t border-[#24303f]/40">
                      <span className="text-[10px] text-gray-500 font-mono">
                        Submitted: {new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>

                      <div className="flex gap-2">
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'approved')}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              id={`approve-btn-${app.id}`}
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'rejected')}
                              className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              id={`reject-btn-${app.id}`}
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteApplication(app.id)}
                          className="p-1.5 bg-[#24303f]/50 hover:bg-[#24303f] hover:text-rose-400 border border-[#24303f] text-gray-500 rounded-lg transition"
                          id={`delete-btn-${app.id}`}
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: HOST CHAT MANAGER */}
      {activeSubTab === 'chats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-[#24303f] rounded-2xl overflow-hidden bg-[#17212b]" id="chats-subview">
          {/* Left Panel: Hosts List */}
          <div className="md:col-span-1 border-r border-[#24303f] h-[550px] flex flex-col bg-[#17212b]/60">
            <div className="p-4 border-b border-[#24303f]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Hosts Conversations</h4>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#24303f]/50">
              {hostsList.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <User className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                  <p className="text-[11px]">No active hosts available for chat.</p>
                </div>
              ) : (
                hostsList.map((host) => {
                  const isSelected = selectedHostId === host.id;
                  const unread = unreadCounts[host.id] || 0;
                  return (
                    <button
                      key={host.id}
                      onClick={() => setSelectedHostId(host.id)}
                      className={`w-full p-3.5 flex items-center gap-3 transition text-left relative ${
                        isSelected 
                          ? 'bg-[#2481cc]/15 text-white' 
                          : 'hover:bg-[#24303f]/30 text-gray-300'
                      }`}
                    >
                      <img 
                        src={host.profile_image} 
                        alt={host.first_name} 
                        className="w-9 h-9 rounded-full object-cover border border-[#24303f]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold truncate block text-white">{host.first_name || host.username}</span>
                          {unread > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                              {unread}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 block truncate font-mono">@{host.username}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Chat Room */}
          <div className="md:col-span-2 h-[550px] flex flex-col bg-[#17212b]/95">
            {selectedHostId ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-[#24303f] flex items-center gap-3">
                  {hostsList.find(h => h.id === selectedHostId)?.profile_image && (
                    <img 
                      src={hostsList.find(h => h.id === selectedHostId)?.profile_image} 
                      alt="Avatar" 
                      className="w-9 h-9 rounded-full object-cover border border-[#24303f]"
                    />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {hostsList.find(h => h.id === selectedHostId)?.first_name || 'Host Chat Room'}
                    </h4>
                    <span className="text-[9px] text-[#2481cc] font-mono block">
                      @{hostsList.find(h => h.id === selectedHostId)?.username}
                    </span>
                  </div>
                </div>

                {/* Scroller */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                      <MessageSquare className="w-8 h-8 text-gray-600 mb-2" />
                      <p className="text-xs">No chat history found.</p>
                      <p className="text-[10px] text-gray-650 mt-1">Send a message to open communication channels with this host.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === 'admin-maxwell';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div className={`p-3 rounded-xl text-xs relative ${
                            isOwn 
                              ? 'bg-[#2481cc] text-white rounded-tr-none' 
                              : 'bg-[#24303f]/75 text-gray-200 rounded-tl-none border border-[#24303f]'
                          }`}>
                            {msg.attachment_url && (
                              <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-black/10">
                                {msg.attachment_type === 'image' ? (
                                  <img src={msg.attachment_url} alt="Attachment" className="max-h-40 object-cover rounded-lg" />
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
                          <span className="text-[9px] text-gray-500 mt-1 font-mono">
                            {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input Form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[#24303f] bg-[#17212b]">
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
                      placeholder="Type a response to this host..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      disabled={isSendingMessage}
                      className="flex-1 bg-[#24303f]/50 border border-[#24303f] rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition"
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
              </>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-gray-500">
                <MessageSquare className="w-10 h-10 text-gray-600 mb-2" />
                <p className="text-xs font-bold text-white">Select a Host Room</p>
                <p className="text-[10px] text-gray-500 mt-1">Choose an active host from the sidebar directory to open private chats.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
