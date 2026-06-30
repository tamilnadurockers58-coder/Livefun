import React, { useState } from 'react';
import { Video, Settings, User } from '../types';
import { CreditCard, Copy, Check, Sparkles, HelpCircle, ArrowRight, CheckCircle2, X } from 'lucide-react';

interface PaymentModalProps {
  video: Video;
  settings: Settings;
  user: User;
  onClose: () => void;
  onSubmitPurchase: (transactionId: string) => Promise<void>;
}

export default function PaymentModal({ video, settings, user, onClose, onSubmitPurchase }: PaymentModalProps) {
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(settings.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!transactionId.trim()) {
      setErrorMsg('UPI Transaction ID / Ref / UTR is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitPurchase(transactionId);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0e1621]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="payment-modal-wrapper">
      <div className="max-w-md w-full bg-[#17212b] border border-[#24303f] rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#24303f] bg-[#17212b]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Unlock Premium Stream</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-lg transition"
            id="close-payment-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-4" id="payment-success-screen">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Verification Pending</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              We received your payment reference: <strong className="font-mono text-white text-xs">{transactionId}</strong>
            </p>
            <p className="text-xs text-gray-400 leading-normal">
              Admin is auditing the bank statement. Once approved, this video will unlock permanently, and you can resume playback from the exact paused position.
            </p>
            
            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full bg-[#2481cc] hover:bg-[#179cde] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md"
              >
                Back to Player
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4" id="payment-input-screen">
            
            {/* Video Overview */}
            <div className="bg-[#24303f]/30 border border-[#24303f] p-3 rounded-xl flex items-center gap-3">
              <img 
                src={video.thumbnail_url} 
                alt={video.title} 
                className="w-16 h-11 object-cover rounded border border-[#24303f]"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white line-clamp-1">{video.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                    Price: ₹{video.price}
                  </span>
                  <span className="text-[10px] text-gray-400">Continuous playback</span>
                </div>
              </div>
            </div>

            {/* Steps & QR Code Details */}
            <div className="space-y-3.5 bg-[#24303f]/10 p-3 rounded-xl border border-[#24303f]/50">
              <div className="flex justify-between items-center bg-[#24303f]/40 p-2.5 rounded-lg border border-[#24303f]">
                <div>
                  <span className="text-[10px] text-gray-400 font-medium">Platform UPI ID</span>
                  <p className="text-xs text-white font-mono font-bold mt-0.5">{settings.upi_id}</p>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-2 bg-[#17212b] text-[#2481cc] hover:text-[#179cde] rounded-lg transition border border-[#24303f] flex items-center justify-center active:scale-95"
                  title="Copy UPI ID"
                  id="copy-upi-id-btn"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* QR Image Display */}
              <div className="flex flex-col items-center py-2 border-y border-[#24303f]/50">
                <img 
                  src={settings.qr_image} 
                  alt="UPI Payment QR Code" 
                  className="w-40 aspect-square object-contain rounded-xl border-4 border-white/90 p-1 bg-white shadow-lg"
                />
                <span className="text-[10px] text-gray-400 text-center mt-2.5 leading-relaxed font-semibold">
                  Scan this QR code using any UPI Application (PhonePe, GPay, Paytm, BHIM)
                </span>
              </div>

              {/* Instruction Steps */}
              <div className="text-[10px] text-gray-400 space-y-1 bg-[#17212b]/40 p-2.5 rounded-lg border border-[#24303f]">
                <div className="flex gap-1.5">
                  <span className="text-[#2481cc] font-bold font-mono">1.</span>
                  <span>Scan the QR code or copy UPI ID to transfer <strong className="text-white">₹{video.price}</strong>.</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-[#2481cc] font-bold font-mono">2.</span>
                  <span>Copy the 12-digit transaction number (UTR / Reference ID).</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-[#2481cc] font-bold font-mono">3.</span>
                  <span>Paste it below and click submit to request direct admin approval.</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Input fields */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                UPI Reference Number (UTR / Ref ID) *
              </label>
              <input
                type="text"
                placeholder="e.g. 629384019284"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#2481cc] font-mono transition"
                id="payment-ref-input"
              />
              <span className="text-[9px] text-gray-500 mt-1 block">Usually a 12-digit number found in transaction history receipt details.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              id="submit-payment-verif-btn"
            >
              {isSubmitting ? 'Verifying Ref...' : 'I Have Paid - Request Unlock'}
            </button>
          </form>
        )}

        {/* Footer Support Notice */}
        <div className="p-3 bg-[#0e1621] border-t border-[#24303f] text-center text-[10px] text-gray-500">
          Disputes or queries? Telegram Support: <a href={`https://t.me/${settings.support_email.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="font-mono text-gray-300 font-bold hover:text-[#2481cc] transition underline">{settings.support_email}</a>
        </div>

      </div>
    </div>
  );
}
