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
    <div className="w-full mx-auto space-y-8 select-none font-sans">
      {/* Top Welcome Heading */}
      <div>
        <h1 className="text-3xl sm:text-[38px] font-bold text-[#0E1B2A] tracking-tight">
          Welcome back
        </h1>
        <p className="text-[15px] text-[#475569] mt-2 leading-relaxed font-normal">
          Sign in to access the Shuja Forces Academy examination and administration system.
        </p>
      </div>

      {/* Compact Inline Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-[#FDF2F2] border border-[#FCA5A5] rounded-xl text-sm text-[#991B1B] flex items-start space-x-3 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
          <span className="leading-snug font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identifier Field */}
        <div>
          <label className="block text-[14px] font-medium text-[#17202A] mb-1.5">
            Email / Roll Number / Staff ID
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email, roll number or staff ID"
              className="w-full pl-11 pr-4 h-[50px] text-[15px] bg-white sm:bg-[#F8FAFC] border border-[#E6E8EC] rounded-xl text-[#17202A] placeholder-[#64748B] focus:bg-white focus:outline-none focus:border-[#0E1B2A] focus:ring-2 focus:ring-[#0E1B2A]/10 transition-colors"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-[14px] font-medium text-[#17202A] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full pl-11 pr-12 h-[50px] text-[15px] bg-white sm:bg-[#F8FAFC] border border-[#E6E8EC] rounded-xl text-[#17202A] placeholder-[#64748B] focus:bg-white focus:outline-none focus:border-[#0E1B2A] focus:ring-2 focus:ring-[#0E1B2A]/10 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E1B2A] p-1.5 rounded-lg focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Actions Row */}
        <div className="flex items-center justify-between text-[13px] pt-1">
          <label className="flex items-center space-x-2.5 text-[#475569] cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#E6E8EC] text-[#0E1B2A] focus:ring-[#0E1B2A]/20 cursor-pointer"
            />
            <span className="font-medium">Remember me</span>
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
          className="w-full h-[50px] mt-2 flex items-center justify-center space-x-2 bg-[#0E1B2A] hover:bg-[#15283B] text-white rounded-xl text-[15px] font-semibold transition-all duration-150 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-5 h-5 text-[#C6A75E] opacity-90" />
            </>
          )}
        </button>
      </form>

      {/* Footer Support Notice */}
      <div className="pt-6 text-center">
        <p className="text-[14px] text-[#475569] font-medium">
          Need help accessing your account?{' '}
          <button
            type="button"
            className="text-[#0E1B2A] font-semibold cursor-pointer hover:underline focus:outline-none"
            onClick={() => toast.info('Contact system command at support@forcesacademy.edu.pk')}
          >
            Contact academy administration
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
