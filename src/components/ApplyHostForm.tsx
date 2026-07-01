import React, { useState } from 'react';
import { Sparkles, User, Mail, Calendar, HelpCircle, FileText, Camera, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface ApplyHostFormProps {
  user: UserType;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ApplyHostForm({ user, onBack, onSuccess }: ApplyHostFormProps) {
  const [fullName, setFullName] = useState(user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [telegramUsername, setTelegramUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [experience, setExperience] = useState('');
  const [whyHost, setWhyHost] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user.profile_image || '');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'host_applications');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image to server');
      }

      const data = await response.json();
      setProfilePhoto(data.url);
    } catch (err: any) {
      setError(err.message || 'Error uploading profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!fullName || !age || !experience || !whyHost || !profilePhoto) {
      setError('Please fill in all required fields and upload a profile photo.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/host-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          full_name: fullName,
          age: Number(age),
          gender,
          telegram_username: telegramUsername,
          email,
          experience,
          why_host: whyHost,
          profile_photo_url: profilePhoto
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit application');
      }

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto bg-[#17212b]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 text-center shadow-2xl my-6" id="host-app-success">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Application Submitted Successfully!</h2>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed max-w-sm mx-auto">
          Thank you for applying to become a host on our premium portal. Our administrators will review your application details shortly. You will be notified of your host role upgrade once approved.
        </p>
        <div className="mt-8 pt-4 border-t border-[#24303f]/50">
          <button
            onClick={onSuccess}
            className="px-6 py-2 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-xl text-xs font-bold transition"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-[#17212b]/80 backdrop-blur-xl border border-[#24303f] rounded-2xl p-6 md:p-8 shadow-2xl my-4" id="host-app-form">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#24303f]/50">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
          id="host-app-back-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
        <div className="flex items-center gap-1 bg-[#2481cc]/10 text-[#2481cc] border border-[#2481cc]/15 px-2.5 py-1 rounded-full text-[10px] font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Apply to Host
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-white tracking-tight">Host Application Portal</h2>
        <p className="text-xs text-gray-400 mt-1">
          Share your experience and personality. Join our premium team and start streaming live to your followers.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center" id="host-app-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo Upload Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#24303f]/25 p-4 rounded-xl border border-[#24303f]/40">
          <div className="relative">
            <img
              src={profilePhoto || 'https://api.dicebear.com/7.x/adventurer/svg?seed=HostDefault'}
              alt="Application Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#2481cc]/20 shadow-md bg-[#17212b]"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-full cursor-pointer shadow shadow-black/40 transition">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <span className="block text-xs font-bold text-white">Upload Your Profile Photo <span className="text-rose-400">*</span></span>
            <span className="block text-[10px] text-gray-500 mt-1">Accepts PNG, JPG, or JPEG up to 5MB.</span>
            {isUploading && <span className="block text-[10px] text-[#2481cc] font-medium mt-1 animate-pulse">Uploading Image...</span>}
          </div>
        </div>

        {/* 2 Column Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Maxwell Blackey"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Age <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="number"
                placeholder="24"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Gender <span className="text-rose-400">*</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
            >
              <option value="Male" className="bg-[#17212b]">Male</option>
              <option value="Female" className="bg-[#17212b]">Female</option>
              <option value="Non-Binary" className="bg-[#17212b]">Non-Binary</option>
              <option value="Prefer Not To Say" className="bg-[#17212b]">Prefer Not To Say</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Telegram Username (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-gray-500 font-bold">@</span>
              <input
                type="text"
                placeholder="username"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Contact Email Address <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Streaming / Hosting Experience <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <textarea
              placeholder="Tell us about any hosting, vlogging, live-streaming, or content creation experience you have..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
              rows={3}
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Why do you want to become a host? <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <HelpCircle className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <textarea
              placeholder="What makes you a great fit? What are your content plans?"
              value={whyHost}
              onChange={(e) => setWhyHost(e.target.value)}
              required
              rows={3}
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full py-3 bg-[#2481cc] hover:bg-[#179cde] disabled:bg-[#2481cc]/50 text-white rounded-xl text-xs font-bold tracking-wide transition duration-200 mt-6 flex items-center justify-center gap-2 shadow-lg shadow-[#2481cc]/15"
          id="host-app-submit-btn"
        >
          <Send className="w-4 h-4" /> {isSubmitting ? 'Submitting Application...' : 'Submit Host Application'}
        </button>
      </form>
    </div>
  );
}
