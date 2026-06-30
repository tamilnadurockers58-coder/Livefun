import React, { useEffect, useRef, useState } from 'react';
import { User, Settings } from '../types';
import { Send, LogIn, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface TelegramLoginProps {
  onLogin: (user: User) => void;
  isLoading: boolean;
}

export default function TelegramLogin({ onLogin, isLoading: parentIsLoading }: TelegramLoginProps) {
  const [botUsername, setBotUsername] = useState('PremiumStreamBot');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [rawPayload, setRawPayload] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the bot username from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: Settings) => {
        if (data && data.telegram_bot_username) {
          setBotUsername(data.telegram_bot_username);
        }
      })
      .catch((err) => {
        console.error('Failed to load settings in TelegramLogin:', err);
      });
  }, []);

  // Initialize and load the official Telegram Login Widget
  useEffect(() => {
    if (!containerRef.current || showPasteFallback) return;

    // Clear previous elements
    containerRef.current.innerHTML = '';

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'true');

    // Define the global callback function that Telegram widget executes on success
    (window as any).onTelegramAuth = (authData: any) => {
      handleVerifyPayload(authData);
    };

    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botUsername, showPasteFallback]);

  // Send authentication payload to backend for cryptographic verification
  const handleVerifyPayload = async (payload: any) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'Cryptographic Telegram verification failed.');
      }
    } catch (err) {
      setError('Network error during Telegram authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse pasted URL query parameters or JSON to verify cryptographically
  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rawPayload.trim()) {
      setError('Please paste the Telegram auth payload or URL parameters.');
      return;
    }

    try {
      let parsed: any = {};
      const trimmed = rawPayload.trim();

      if (trimmed.startsWith('{')) {
        // Parse JSON format
        parsed = JSON.parse(trimmed);
      } else {
        // Parse URL query string format: id=xxx&first_name=yyy&hash=zzz
        const searchParams = new URLSearchParams(trimmed.replace(/^\?/, ''));
        searchParams.forEach((value, key) => {
          parsed[key] = value;
        });
      }

      if (!parsed.id || !parsed.hash) {
        setError('Invalid format. Payload must contain at least "id" and "hash" parameters.');
        return;
      }

      handleVerifyPayload(parsed);
    } catch (err) {
      setError('Failed to parse input. Ensure you pasted a valid JSON or query string.');
    }
  };

  return (
    <div className="max-w-md w-full bg-[#17212b] border border-[#24303f] rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="telegram-login-container">
      {/* Glow ambient background effects */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#2481cc]/20 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#2481cc]/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Profile Header */}
      <div className="text-center mb-6 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-[#2481cc]/10 border-2 border-[#2481cc] flex items-center justify-center shadow-lg shadow-[#2481cc]/20">
            <Send className="w-10 h-10 text-[#2481cc] transform -rotate-12 translate-x-px" />
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#2481cc] flex items-center justify-center border-2 border-[#17212b]">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-white tracking-tight" id="telegram-login-title">
          Telegram Authorization
        </h2>
        <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
          Log in securely using the official Telegram widget. Your session is fully validated.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2 items-start" id="auth-error-msg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Conditional Authentication View */}
      {!showPasteFallback ? (
        /* OFFICIAL TELEGRAM LOGIN WIDGET (PRODUCTION) */
        <div className="py-4 flex flex-col items-center justify-center min-h-[100px] border border-dashed border-[#24303f] rounded-2xl bg-[#0e1621]/40 mb-4">
          {(isLoading || parentIsLoading) ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-[#2481cc] animate-spin" />
              <span className="text-[11px] text-gray-400 font-medium">Verifying credentials...</span>
            </div>
          ) : (
            <div className="space-y-4 w-full flex flex-col items-center">
              {/* Telegram script mounts here */}
              <div ref={containerRef} className="flex justify-center" />
              
              <p className="text-[10px] text-gray-500 text-center max-w-[240px] px-2">
                Connected Bot: <span className="text-[#2481cc] font-mono">@{botUsername}</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        /* CRYPTOGRAPHIC PASTE FALLBACK FORM (PRODUCTION EXTRA COPIER) */
        <form onSubmit={handlePasteSubmit} className="space-y-4 mb-4" id="paste-fallback-form">
          <div className="p-3 bg-amber-500/10 border border-amber-500/10 rounded-xl text-[11px] text-amber-400/95 leading-normal">
            <strong>Secure Manual Entry:</strong> Paste official Telegram auth query string or JSON payload to verify cryptographically on the server.
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Auth Parameters / URL Query String / JSON
            </label>
            <textarea
              rows={4}
              placeholder="e.g. id=1234&first_name=Pavel&username=durov&auth_date=1600000000&hash=abc..."
              value={rawPayload}
              onChange={(e) => setRawPayload(e.target.value)}
              disabled={isLoading || parentIsLoading}
              required
              className="w-full px-3 py-2 text-xs font-mono bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition resize-none"
              id="raw-payload-textarea"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || parentIsLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-xl text-xs font-bold transition duration-200 disabled:opacity-50"
            id="btn-cryptographic-verify"
          >
            <LogIn className="w-4 h-4" />
            {isLoading || parentIsLoading ? 'Verifying...' : 'Cryptographically Verify & Login'}
          </button>
        </form>
      )}

      {/* Mode selectors and fallback toggles */}
      <div className="flex flex-col gap-2 items-center text-center mt-2">
        <button
          onClick={() => {
            setShowPasteFallback(!showPasteFallback);
            setError('');
          }}
          className="text-[10px] text-gray-500 hover:text-gray-300 hover:underline"
          id="toggle-paste-fallback"
        >
          {showPasteFallback ? 'Show Telegram Login Widget' : 'Use Cryptographic Paste (Manual Entry)'}
        </button>
      </div>

      {/* Secure footer trust message */}
      <div className="mt-5 pt-3 border-t border-[#24303f] flex items-center justify-center gap-2 text-[9px] text-gray-500 uppercase tracking-wide">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2481cc]" />
        <span>
          End-to-end cryptographic hash verification
        </span>
      </div>
    </div>
  );
}
