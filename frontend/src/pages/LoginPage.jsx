import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' or 'faculty'

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleQuickFill = (role) => {
    setSelectedRole(role);
    if (role === 'faculty') {
      setEmail('faculty@evalsys.edu');
      setPassword('Faculty@123');
    } else {
      setEmail('alex.student@evalsys.edu');
      setPassword('Student@123');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(email.trim(), password);
      if (userData.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Invalid email or password. Please check your credentials.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient backdrops */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/20">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            EvalSys Portal
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
            Automated Student Project Evaluation with Plagiarism Detection & Isolated Code Validation
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-900/90 backdrop-blur-sm border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          
          {/* Role Preset Quick Switcher */}
          <div className="mb-6 p-1 bg-slate-950 rounded-xl border border-slate-800 flex">
            <button
              type="button"
              onClick={() => handleRoleQuickFill('student')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'student'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student Role
            </button>
            <button
              type="button"
              onClick={() => handleRoleQuickFill('faculty')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'faculty'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Faculty Role
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <span className="font-semibold text-rose-400">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex.student@evalsys.edu"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Student Register Option */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              New student joining an assessment?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-2 hover:underline">
                Register Student Account
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="mt-5 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Verified Demo Credentials:</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-400 font-medium">Faculty:</span>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">faculty@evalsys.edu</code>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Faculty@123</code>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-blue-400 font-medium">Student (Alex):</span>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">alex.student@evalsys.edu</code>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Student@123</code>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-emerald-400 font-medium">Student (Priya):</span>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">priya.student@evalsys.edu</code>
              <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Student@123</code>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
