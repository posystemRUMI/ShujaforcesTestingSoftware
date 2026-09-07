import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = identifier.trim();
    const trimmedPass = password.trim();

    if (!trimmedId) {
      setErrorMessage('Please enter your email, roll number, or staff ID.');
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(trimmedId, trimmedPass);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid email or password.');
        return;
      }

      toast.success('Signed in successfully.');

      // Navigation based on target route or authenticated role
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Will be redirected appropriately by RequireRole / route guards
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('Login error:', err);
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('connect')) {
        setErrorMessage('Unable to connect to the academy server. Please try again.');
      } else {
        setErrorMessage('Unable to connect to the academy server. Please try again.');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 select-none font-sans">
      {/* Top Welcome Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0E1B2A] tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-1.5 leading-relaxed font-normal">
          Sign in to access your academy examination & administration portal.
        </p>
      </div>

      {/* Compact Inline Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-[#FDF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-start space-x-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
          <span className="leading-snug font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier Field */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1.5">
            Email / Roll Number / Staff ID
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. a@gmail.com, SFA-001, or t1@gmail.com"
              className="w-full pl-10 pr-4 h-12 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E6E8EC] rounded-lg text-[#17202A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0E1B2A] focus:ring-2 focus:ring-[#0E1B2A]/10 transition-colors"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-[#17202A] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full pl-10 pr-10 h-12 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E6E8EC] rounded-lg text-[#17202A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0E1B2A] focus:ring-2 focus:ring-[#0E1B2A]/10 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E1B2A] p-1 rounded focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Secondary Actions Row */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center space-x-2 text-[#667085] cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#E6E8EC] text-[#0E1B2A] focus:ring-[#0E1B2A]/20 cursor-pointer"
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => toast.info('Please contact academy administrator to reset your password.')}
            className="text-[#0E1B2A] font-semibold hover:underline focus:outline-none"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 flex items-center justify-center space-x-2 bg-[#0E1B2A] hover:bg-[#1C2E42] text-white rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-60 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
            </>
          )}
        </button>
      </form>

      {/* Footer Support Notice */}
      <div className="pt-5 border-t border-[#E6E8EC] text-center">
        <p className="text-xs text-[#667085]">
          Need help accessing your account?{' '}
          <span
            className="text-[#0E1B2A] font-medium cursor-pointer hover:underline"
            onClick={() => toast.info('Contact system command at support@forcesacademy.edu.pk')}
          >
            Contact testing center
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
