import React, { useRef, useState, useEffect } from 'react';
import { Video, User, Purchase } from '../types';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, ShieldAlert, Sparkles, Key, Lock, 
  CheckCircle2, Send, Eye, Wifi, Heart, Radio, MessageSquare, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  video: Video;
  user: User | null;
  hasAccess: boolean;
  onUnlock: (pausedAt: number) => void;
  purchaseStatus?: 'pending' | 'rejected' | null;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'system';
  username?: string;
  avatar?: string;
  text: string;
  time: string;
  color?: string;
}

interface FloatingHeart {
  id: number;
  color: string;
  scale: number;
  left: number;
}

const CHAT_USERS = [
  { username: 'Aarav_YT', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav', color: 'text-amber-400' },
  { username: 'NehaStreamz', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Neha', color: 'text-pink-400' },
  { username: 'ProGamer_99', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ProGamer', color: 'text-cyan-400' },
  { username: 'Rajesh_Kumar', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rajesh', color: 'text-emerald-400' },
  { username: 'Sonia_Vibe', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sonia', color: 'text-purple-400' },
  { username: 'Tej_Live', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tej', color: 'text-red-400' },
  { username: 'Vikram_Playz', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram', color: 'text-orange-400' },
  { username: 'Divya_12', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Divya', color: 'text-yellow-400' },
  { username: 'Karan_Gaming', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Karan', color: 'text-blue-400' },
  { username: 'Pooja_X', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Pooja', color: 'text-rose-400' },
  { username: 'Rahul_OP', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rahul', color: 'text-teal-400' },
  { username: 'Sneha_Sparkle', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sneha', color: 'text-indigo-400' }
];

const CHAT_TEMPLATES = [
  "Incredible stream gameplay!! 🔥🔥",
  "OMG is this real??",
  "Wow, nice streaming quality!",
  "Please unlock the next stream, loving the content!",
  "Can you repeat that part?",
  "Loving the vibe here!",
  "Let's gooo! 🚀🚀",
  "OP stream! OP! 🔥",
  "Wow, this subscription price is a steal!",
  "Best live content on Telegram so far!",
  "Are you guys seeing this? 😱",
  "Just joined, awesome stream! 🔔",
  "Hello from Delhi!",
  "Super high definition stream! 💖",
  "Insane skills! 🔥🎮",
  "Hahaha too funny!",
  "Let's push for 2k viewers!",
  "Is this 1080p60 fps?",
  "Love the background music on this stream",
  "So smooth, no buffering at all!",
  "Best streaming app hands down 💯"
];

export default function VideoPlayer({ video, user, hasAccess, onUnlock, purchaseStatus }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPreviewEnded, setIsPreviewEnded] = useState(false);

  // Live stream simulated states
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(1240);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [connectionSpeed, setConnectionSpeed] = useState('9.8 Mbps');
  const [showJoinToast, setShowJoinToast] = useState<string | null>(null);

  // Initialize stream elapsed duration to a realistic offset on video switch
  useEffect(() => {
    // Generate a starting live duration between 1 and 3 hours
    const randomStartSecs = Math.floor(Math.random() * 3600) + 3600;
    setStreamDuration(randomStartSecs);

    // Initial viewer count setup
    setViewerCount(Math.floor(Math.random() * 400) + 1100);

    // Clean states when video changes
    setIsPlaying(false);
    setCurrentTime(0);
    setIsPreviewEnded(false);

    // Check if there's a saved resume timestamp in localStorage
    const savedTime = localStorage.getItem(`resume_${video.id}`);
    if (savedTime && hasAccess && videoRef.current) {
      const parsed = parseFloat(savedTime);
      videoRef.current.currentTime = parsed;
      setCurrentTime(parsed);
      localStorage.removeItem(`resume_${video.id}`);
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }

    // Generate initial set of chat messages customized to the video
    const initialMessages: ChatMessage[] = [];
    const initialCount = 8;
    const now = new Date();
    
    for (let i = initialCount; i > 0; i--) {
      const msgTime = new Date(now.getTime() - i * 15000);
      const isSystem = Math.random() < 0.25;
      const randomUser = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
      
      if (isSystem) {
        initialMessages.push({
          id: `init-sys-${i}`,
          type: 'system',
          text: `🟢 ${randomUser.username} joined the stream`,
          time: msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        const textTemplate = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
        // Sometimes inject stream/video title
        const text = Math.random() < 0.3 
          ? textTemplate.replace("stream", `"${video.title}" stream`)
          : textTemplate;

        initialMessages.push({
          id: `init-msg-${i}`,
          type: 'user',
          username: randomUser.username,
          avatar: randomUser.avatar,
          color: randomUser.color,
          text: text,
          time: msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }
    setChatMessages(initialMessages);
  }, [video.id]);

  // Live broadcast ticks (every 1 second when playing)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Periodic simulated live fluctuations (Viewer counts, Connection Quality, Chat Messages)
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate viewers
      setViewerCount(prev => {
        const delta = Math.floor(Math.random() * 17) - 8;
        const newVal = prev + delta;
        return newVal < 500 ? 500 : newVal;
      });

      // Fluctuate connection speed
      setConnectionSpeed(() => {
        const speed = (8.5 + Math.random() * 2.5).toFixed(1);
        return `${speed} Mbps`;
      });

      // Add a live chat message
      const isSystem = Math.random() < 0.2;
      const randomUser = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isSystem) {
        const action = Math.random() < 0.7 ? 'joined' : 'liked';
        const text = action === 'joined' 
          ? `🟢 ${randomUser.username} joined the stream`
          : `💖 ${randomUser.username} liked the broadcast`;
        
        setChatMessages(prev => [...prev.slice(-49), {
          id: `live-sys-${Date.now()}`,
          type: 'system',
          text,
          time: timeStr
        }]);

        // If joined, trigger a tiny visual bottom overlay notification
        if (action === 'joined' && Math.random() < 0.5) {
          setShowJoinToast(`${randomUser.username} joined`);
          setTimeout(() => setShowJoinToast(null), 3000);
        }
      } else {
        const textTemplate = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
        const text = Math.random() < 0.25
          ? textTemplate.replace("stream", `"${video.title}" stream`)
          : textTemplate;

        setChatMessages(prev => [...prev.slice(-49), {
          id: `live-msg-${Date.now()}`,
          type: 'user',
          username: randomUser.username,
          avatar: randomUser.avatar,
          color: randomUser.color,
          text,
          time: timeStr
        }]);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [video.title]);

  // Auto scroll chat to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPreviewEnded && !hasAccess) {
      onUnlock(30);
      return;
    }

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(err => console.log('Live playback error:', err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    // Enforce default playback rate
    if (videoRef.current.playbackRate !== 1) {
      videoRef.current.playbackRate = 1;
    }

    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    // Live broadcast preview constraint: exactly 30 seconds limit for non-purchased premium streams
    if (!hasAccess && video.price > 0 && current >= 30) {
      videoRef.current.pause();
      videoRef.current.currentTime = 30;
      setCurrentTime(30);
      setIsPlaying(false);
      setIsPreviewEnded(true);
      onUnlock(30);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen error', err);
      });
    }
  };

  const handleUnlockClick = () => {
    const pauseTime = videoRef.current ? videoRef.current.currentTime : 0;
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    onUnlock(pauseTime);
  };

  // Chat message submission
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userDisplayName = user ? (user.first_name + (user.last_name ? ` ${user.last_name}` : '')) : 'Anonymous Viewer';
    const userHandle = user ? (user.username || userDisplayName.replace(/\s+/g, '_')) : 'Guest_Viewer';
    const userAvatar = user ? user.profile_image : `https://api.dicebear.com/7.x/adventurer/svg?seed=guest`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      type: 'user',
      username: userHandle,
      avatar: userAvatar,
      color: 'text-[#2481cc]',
      text: chatInput,
      time: timeStr
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Trigger a simulated reply after 1.5 seconds to feel highly interactive
    setTimeout(() => {
      const botReplier = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
      const botResponses = [
        `@${userHandle} true! 😂`,
        `@${userHandle} agreed 🔥🔥🔥`,
        `Nice comment @${userHandle}`,
        `Exactly! 🙌`,
        `Let's goooo!`,
        `OP comment @${userHandle}`
      ];

      setChatMessages(prev => [...prev, {
        id: `bot-reply-${Date.now()}`,
        type: 'user',
        username: botReplier.username,
        avatar: botReplier.avatar,
        color: botReplier.color,
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // Add floating heart particles
  const addHeart = () => {
    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      color: ['#ff4b4b', '#ff4b8b', '#ff7bb5', '#ff3366', '#e033ff', '#33a3ff'][Math.floor(Math.random() * 6)],
      scale: 0.6 + Math.random() * 0.8,
      left: Math.floor(Math.random() * 60) - 30, // side offset
    };
    setHearts(prev => [...prev, newHeart]);

    // Clean up heart after animation ends
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2500);
  };

  // Convert seconds to live stopwatch display (e.g. 02:14:05)
  const formatLiveDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const previewTimeLeft = Math.max(0, 30 - Math.floor(currentTime));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id={`live-stream-arena-${video.id}`}>
      
      {/* LEFT COLUMN: Premium Live Broadcast Player (Aspect Ratio Controlled) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* Stream Banner Info Panel */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#17212b] border border-[#24303f] p-4 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="https://api.dicebear.com/7.x/adventurer/svg?seed=broadcaster" 
                alt="Broadcaster" 
                className="w-10 h-10 rounded-full border border-[#2481cc] object-cover" 
              />
              <span className="absolute -bottom-1 -right-1 bg-red-600 text-[8px] font-extrabold px-1 rounded-full text-white border border-[#17212b] animate-pulse">
                LIVE
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">{video.title}</h2>
                <span className="text-[9px] font-bold text-[#2481cc] bg-[#2481cc]/10 px-2 py-0.5 rounded-full border border-[#2481cc]/20">
                  Exclusive Live
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{video.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {video.price > 0 ? (
              hasAccess ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Broadcast Unlocked
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Premium Stream (₹{video.price})
                </span>
              )
            ) : (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                Free Live Feed
              </span>
            )}
          </div>
        </div>

        {/* Live Broadcast Player Frame */}
        <div 
          ref={containerRef}
          onContextMenu={(e) => e.preventDefault()}
          className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-[#24303f] group shadow-2xl"
          id="live-broadcast-stage"
        >
          {/* Native Media Element (The Source Stream) */}
          <video
            ref={videoRef}
            src={video.video_url}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            controls={false} // Strict live broadcast guidelines
            controlsList="nodownload" // Protect stream binary
            disablePictureInPicture
            disableRemotePlayback
            className="w-full h-full object-contain cursor-pointer"
            id="live-broadcasting-native-video"
          />

          {/* SECURITY WATERMARK (Only for premium videos when user is authenticated) */}
          {video.price > 0 && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none opacity-20">
              <div className="absolute top-1/4 left-1/4 transform -rotate-12 text-[10px] sm:text-xs font-mono text-white/50 tracking-widest uppercase bg-black/20 px-2 py-1 rounded border border-white/5">
                @{user?.username || user?.first_name || 'GUEST_NODE'} • SECURE BROADCAST #{user?.id ? user.id.substring(0,8) : '000000'}
              </div>
              <div className="absolute bottom-1/4 right-1/4 transform rotate-12 text-[10px] sm:text-xs font-mono text-white/50 tracking-widest uppercase bg-black/20 px-2 py-1 rounded border border-white/5">
                @{user?.username || user?.first_name || 'GUEST_NODE'} • IP: PROTECTED FEED
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-45 text-[14px] sm:text-lg font-extrabold font-mono text-white/30 tracking-widest uppercase border-4 border-dashed border-white/10 p-4">
                @{user?.username || user?.first_name || 'GUEST_NODE'}
              </div>
            </div>
          )}

          {/* REALISTIC LIVE STREAM HUD OVERLAYS */}
          
          {/* Top-Left Live HUD Capsule */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold bg-red-600 text-white rounded-md tracking-wider shadow-md animate-pulse">
              <Radio className="w-3.5 h-3.5 animate-spin" /> LIVE
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-black/60 backdrop-blur-md text-white rounded-md shadow-md border border-white/10">
              <Eye className="w-3.5 h-3.5 text-red-500" /> {viewerCount.toLocaleString()} watching
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-black/60 backdrop-blur-md text-gray-300 rounded-md shadow-md border border-white/10 font-mono">
              {formatLiveDuration(streamDuration)}
            </span>
          </div>

          {/* Top-Right Connection/Stream Diagnostics */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-black/60 backdrop-blur-md text-emerald-400 rounded-md border border-emerald-500/20 shadow-md">
              <Wifi className="w-3.5 h-3.5 animate-bounce" /> {connectionSpeed}
            </span>
            <span className="hidden sm:inline-block px-2 py-1 text-[9px] font-bold bg-black/60 backdrop-blur-md text-gray-400 rounded border border-white/10 uppercase tracking-widest">
              1080p60 fps
            </span>
          </div>

          {/* Premium Preview Timer Indicator (Sticky alert) */}
          {!hasAccess && video.price > 0 && !isPreviewEnded && (
            <div className="absolute top-16 left-4 z-10 bg-amber-500/90 text-black text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-amber-600 shadow-lg flex items-center gap-1.5 animate-pulse">
              <Lock className="w-3.5 h-3.5" /> PREVIEW: WATCH NEXT {previewTimeLeft}s • UNLOCK LIVE BROADCAST
            </div>
          )}

          {/* JOIN USER TOAST ALERT (Slides from bottom center) */}
          <AnimatePresence>
            {showJoinToast && (
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="absolute bottom-16 left-4 z-10 bg-black/75 backdrop-blur-md border border-white/10 text-[10px] text-gray-200 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                <span>{showJoinToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PREVIEW COMPLETED: Blurred Payment Wall Overlay */}
          {!hasAccess && video.price > 0 && isPreviewEnded && (
            <div className="absolute inset-0 bg-[#0e1621]/90 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6 z-20 animate-fade-in">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 mb-4 shadow-inner animate-pulse">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Premium Live Broadcast Only</h3>
              <p className="text-xs text-gray-300 max-w-sm mt-2 leading-relaxed">
                The free 30-second preview of <span className="text-white font-semibold">"{video.title}"</span> has completed. Unlock direct, unlimited access to the full live broadcast feed.
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleUnlockClick}
                  className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-6 py-3 rounded-xl transition duration-150 active:scale-95 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-unlock-live-stream"
                >
                  <Key className="w-4 h-4" /> Unlock Direct Live Stream (₹{video.price})
                </button>
              </div>

              {purchaseStatus === 'pending' && (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Awaiting direct UPI validation from operator node. Stream resumes instantly on approval.</span>
                </div>
              )}
            </div>
          )}

          {/* FLOATING HEART ANIMATION CONTAINER */}
          <div className="absolute bottom-16 right-6 pointer-events-none z-20 h-64 w-32 overflow-hidden">
            <AnimatePresence>
              {hearts.map(heart => (
                <motion.div
                  key={heart.id}
                  initial={{ y: 220, x: heart.left, opacity: 1, scale: 0.1 }}
                  animate={{ 
                    y: 0, 
                    x: heart.left + Math.sin(heart.id) * 35, // Drifts sideways beautifully
                    opacity: [1, 1, 0.8, 0], 
                    scale: heart.scale 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.3, ease: "easeOut" }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl filter drop-shadow-md"
                  style={{ color: heart.color }}
                >
                  ❤️
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* CUSTOM LIVE BROADCAST PLAYER HUD CONTROLLER BAR */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/85 to-transparent p-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-10">
            
            {/* Timeline Progress Line (Pure static HUD indicator labeled "LIVE") */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
              <span className="text-[9px] text-red-500 font-extrabold font-mono tracking-wider">LIVE STREAM</span>
              <div className="flex-1 h-1 bg-red-600/30 rounded-full relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full"></div>
              </div>
              <span className="text-[10px] text-gray-400 font-bold font-mono tracking-tighter">RECEIVER OK</span>
            </div>

            {/* Broadcast HUD Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Visual Pause/Play (Stream Feed Pause) */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-red-500 transition-colors"
                  title={isPlaying ? 'Pause Local stream' : 'Resume Local stream'}
                  id="live-btn-play-pause"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                {/* Volume Level Controllers */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-red-500 transition-colors"
                    id="live-btn-mute"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono uppercase tracking-wider">
                  Excellent Connection
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Floating Heart Button */}
                <button
                  onClick={addHeart}
                  className="text-pink-500 hover:text-pink-400 hover:scale-110 active:scale-95 transition-all p-1.5 rounded-full bg-white/5 hover:bg-white/10 shadow-lg border border-white/5 cursor-pointer"
                  title="Send Heart Reaction"
                  id="live-btn-heart"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>

                {/* Unlock Stream trigger if not owned */}
                {!hasAccess && video.price > 0 && (
                  <button
                    onClick={handleUnlockClick}
                    className="text-[10px] font-extrabold text-black bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-all shadow-md flex items-center gap-1"
                    id="live-btn-unlock-timeline"
                  >
                    <Key className="w-3 h-3" /> UNLOCK STREAM
                  </button>
                )}

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-red-500 transition-colors"
                  title="Toggle Fullscreen"
                  id="live-btn-fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Realistic Live Streaming Chat Panel */}
      <div className="lg:col-span-4 flex flex-col bg-[#17212b] border border-[#24303f] rounded-2xl overflow-hidden shadow-xl h-[450px] lg:h-full min-h-[400px]">
        
        {/* Chat Room Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#24303f] bg-[#1a2532]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#2481cc]" />
            <span className="text-xs font-bold text-white tracking-wider uppercase">Live Chat Stream</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Active Room</span>
          </div>
        </div>

        {/* Scrolling Chat messages Feed */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#17212b] [&::-webkit-scrollbar-thumb]:bg-[#24303f] [&::-webkit-scrollbar-thumb]:rounded-full"
          id="live-chat-scroller"
        >
          {chatMessages.map((msg) => (
            <div key={msg.id} className="text-xs transition-all duration-300 animate-fade-in">
              {msg.type === 'system' ? (
                // System notification message
                <div className="bg-[#24303f]/20 border border-[#24303f]/30 rounded-lg py-1 px-2.5 text-[10px] text-gray-400 italic font-mono flex items-center justify-between">
                  <span>{msg.text}</span>
                  <span className="text-[9px] text-gray-500 font-normal ml-2">{msg.time}</span>
                </div>
              ) : (
                // Chat message from a user
                <div className="flex items-start gap-2 bg-[#24303f]/10 p-1.5 rounded-lg border border-transparent hover:border-[#24303f]/30 transition-all">
                  <img 
                    src={msg.avatar} 
                    alt={msg.username} 
                    className="w-6 h-6 rounded-full border border-gray-700/50 bg-[#0e1621]" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className={`text-[11px] font-bold tracking-tight ${msg.color || 'text-[#2481cc]'}`}>
                        {msg.username}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-200 leading-snug break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Live Chat Action Footer Form */}
        <form onSubmit={handleSendChat} className="p-3 border-t border-[#24303f] bg-[#131b24] flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={user ? "Send live message..." : "Log in to join active stream chat..."}
              disabled={!user}
              className="w-full pl-3 pr-8 py-2 bg-[#17212b] border border-[#24303f] rounded-xl text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] transition disabled:opacity-50"
              id="live-chat-input-text"
            />
            <button
              type="button"
              onClick={addHeart}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pink-500 hover:text-pink-400 text-sm cursor-pointer"
              title="React Heart"
            >
              ❤️
            </button>
          </div>
          <button
            type="submit"
            disabled={!user || !chatInput.trim()}
            className="bg-[#2481cc] hover:bg-[#179cde] text-white p-2 rounded-xl transition duration-150 active:scale-95 disabled:opacity-40 disabled:scale-100 flex-shrink-0 cursor-pointer"
            id="live-chat-send-btn"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
}
