import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { UserRole } from '@/types';
import { Eye, EyeOff, Lock, User, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('ADMIN');
  const [identifier, setIdentifier] = useState('HQ-CHIEF-01');
  const [password, setPassword] = useState('AcademyPass2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setErrorMessage(null);
    if (selectedRole === 'ADMIN') {
      setIdentifier('HQ-CHIEF-01');
      setPassword('AdminPass2026!');
    } else if (selectedRole === 'TEACHER') {
      setIdentifier('FAC-PAF-102');
      setPassword('FacultyPass2026!');
    } else {
      setIdentifier('PMA-2601');
      setPassword('CadetPass2026!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Cadet Roll Number or Officer Docket ID.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Security passcode is required to establish terminal clearance.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(identifier, password);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials or unauthorized terminal.');
        toast.error(res.error || 'Authentication failed.');
        return;
      }

      toast.success('Access Granted: Identity verified.');

      if (role === 'STUDENT') {
        navigate('/student');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Authentication error.');
      toast.error('Authentication failed.');
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Role Selection Tabs */}
      <div>
        <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-2 font-display">
          Terminal Clearance Role
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EDF1F5] rounded border border-[#D4D9DF]">
          {(['ADMIN', 'TEACHER', 'STUDENT'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSelect(r)}
              className={`py-1.5 px-2 text-xs font-semibold rounded font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E1B2A] ${
                role === r
                  ? 'bg-[#0E1B2A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0E1B2A] hover:bg-white/60'
              }`}
            >
              {r === 'ADMIN' ? 'Chief Proctor' : r === 'TEACHER' ? 'Instructor' : 'Candidate'}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert Display */}
      {errorMessage && (
        <div className="p-3 bg-[#FDF2F2] border border-[#E29A9A] rounded text-xs text-[#782525] flex items-start space-x-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="leading-tight">{errorMessage}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier Input */}
        <div>
          <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1.5 font-display">
            {role === 'STUDENT' ? 'Cadet Roll Number / CNIC' : 'Officer Docket / Staff ID'}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 stroke-[2]" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={role === 'STUDENT' ? 'e.g., PMA-2601 or 37405-...' : 'e.g., HQ-CHIEF-01'}
              className="w-full pl-9 pr-3 h-10 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-mono text-[#0E1B2A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E] transition-colors"
            />
          </div>
        </div>

        {/* Password Input with Visibility Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider font-display">
              Security Passcode / Biometric Key
            </label>
            <span className="text-[10px] text-[#64748B] font-mono">Air-Gap Local Auth</span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 stroke-[2]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passcode"
              className="w-full pl-9 pr-10 h-10 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-mono text-[#0E1B2A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0E1B2A] p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terminal Security Dossier Badge */}
        <div className="p-2.5 bg-[#EDF6F0] border border-[#88BE9B] rounded text-[11px] font-mono text-[#234E35] flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>STATION: WS-CBT-01</span>
          </div>
          <span className="font-semibold">DEFCON SECURE</span>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 flex items-center justify-center space-x-2 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
        >
          {isLoading ? (
            <span className="font-mono">Authorizing Session...</span>
          ) : (
            <>
              <span>Establish Workstation Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick Testing Helper */}
      <div className="pt-4 border-t border-[#EDF1F5] text-center space-y-1">
        <p className="text-[11px] text-[#64748B]">
          Armed forces induction preparation portal. All login sessions are locally verified.
        </p>
        <div className="flex justify-center space-x-3 text-[11px] font-mono text-[#0E1B2A]">
          <button
            type="button"
            onClick={() => handleRoleSelect('STUDENT')}
            className="hover:underline text-[#455D4A]"
          >
            Switch to Candidate View
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            className="hover:underline text-[#0E1B2A]"
          >
            Switch to Proctor Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
