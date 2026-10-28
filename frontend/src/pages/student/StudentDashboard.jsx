import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import { 
  BookOpen, Clock, Award, CheckCircle, AlertCircle, 
  ArrowRight, Code, HelpCircle, Bug, Calendar, ChevronRight
} from 'lucide-react';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(false);
      const res = await api.get('/student/dashboard');
      setData(res.data);
    } catch (err) {
      setError('Failed to load student dashboard. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome & Student Profile Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Student Assessment Workspace
                </span>
                <span className="text-slate-400 text-xs">ID: {data?.student_id || 'STU'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {data?.student_name || 'Student'}
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                Access your assigned programming assignments, complete the 3-phase assessment (Coding, Viva, Debugging), and receive faculty feedback.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 backdrop-blur-sm self-start md:self-auto">
              <div className="text-right">
                <div className="text-xs text-slate-400">Department</div>
                <div className="text-xs font-semibold text-slate-200">Computer Science & Eng.</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Assessments</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{data?.total_assigned ?? 0}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Available in portal</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{data?.completed_count ?? 0}</h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">Locked & Submitted</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Action</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{data?.pending_count ?? 0}</h3>
              <p className="text-[11px] text-amber-600 mt-1 font-medium">Requires submission</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Published Average</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                {data?.average_score ? `${data.average_score}%` : 'N/A'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">From graded evaluations</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Assigned Assessments Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Coding Assessments</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each assessment contains 3 mandatory sections: Coding Challenge, Viva Questions, and Code Debugging.
              </p>
            </div>
          </div>

          {error && (
            <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {!data?.assessments || data.assessments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">No assessments assigned at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.assessments.map((a) => {
                const isCompleted = a.submission_status === 'Submitted' || a.submission_status === 'Graded';
                return (
                  <div 
                    key={a.id} 
                    className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {a.title}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          a.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          a.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {a.difficulty}
                        </span>
                        <StatusBadge status={a.submission_status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          <span>Max Marks: <strong className="text-slate-700">{a.max_marks}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Deadline: {a.deadline ? new Date(a.deadline).toLocaleDateString() : 'No Limit'}</span>
                        </span>
                        {a.marks_published && a.my_score !== null && (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            <span>Score: {a.my_score} / {a.max_marks}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/student/assessment/${a.id}`)}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
                          isCompleted
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                        }`}
                      >
                        <span>{isCompleted ? 'View Workspace & Submission' : 'Enter Assessment Workspace'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default StudentDashboard;
