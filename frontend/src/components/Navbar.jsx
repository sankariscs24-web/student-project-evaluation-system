import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Code2, LogOut, User, Shield, GraduationCap, Bell } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isFaculty = user?.role === 'faculty';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link to={isFaculty ? "/faculty/dashboard" : "/student/dashboard"} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              EvalSys
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {isFaculty ? "Faculty Portal" : "Student Workspace"}
            </span>
          </div>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3 pl-3 pr-2 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-sm">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-medium text-slate-200 leading-tight">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isFaculty ? "Faculty Instructor" : `Roll: ${user.student_id || 'STU'}`}
                </div>
              </div>
              <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                isFaculty ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                {user.role}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center text-xs font-medium gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
