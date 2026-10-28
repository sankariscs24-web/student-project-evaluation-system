import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import {
  Users, BookOpen, CheckCircle, Clock, Award, ShieldAlert,
  MessageSquare, Search, Filter, ArrowUpRight, BarChart3,
  Layers, ChevronRight, RefreshCw, PlusCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const FacultyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlagiarismFilter, setSelectedPlagiarismFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, subsRes] = await Promise.all([
        api.get('/faculty/dashboard'),
        api.get('/faculty/submissions'),
      ]);
      setStats(statsRes.data);
      setSubmissions(subsRes.data);
    } catch (err) {
      console.error('Error fetching faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_roll.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assessment_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlagiarism =
      selectedPlagiarismFilter === 'all' ||
      s.plagiarism_status.toLowerCase() === selectedPlagiarismFilter.toLowerCase();

    return matchesSearch && matchesPlagiarism;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header with Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Faculty Instructor Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Assessment Analytics & Evaluation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review real-time code executions, plagiarism alerts, viva answers, and publish final marks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition-all"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/faculty/manage-problems"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Manage Problems</span>
            </Link>
          </div>
        </div>

        {/* 8 Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500">Students</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{stats?.total_students ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500">Assessments</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{stats?.total_assessments ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600">Submissions</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.submissions_received ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-amber-600">Pending</span>
            <div className="text-xl font-bold text-amber-600 mt-1">{stats?.pending_submissions ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-indigo-600">Avg Marks</span>
            <div className="text-xl font-bold text-indigo-600 mt-1">{stats?.average_marks ?? 0}%</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-blue-600">Pass Rate</span>
            <div className="text-xl font-bold text-blue-600 mt-1">{stats?.test_case_pass_rate ?? 0}%</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-sm">
            <span className="text-[11px] font-semibold text-rose-600">Plagiarism Alerts</span>
            <div className="text-xl font-bold text-rose-600 mt-1">{stats?.plagiarism_alerts ?? 0}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-slate-600">Feedbacks</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{stats?.feedback_received ?? 0}</div>
          </div>

        </div>

        {/* Charts Section with Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Marks Distribution Bar Chart */}
          <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Marks Distribution (Score Ranges)</h3>
                <p className="text-[11px] text-slate-400">Total scores achieved by students across assessments</p>
              </div>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.marks_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assessment Performance Trends */}
          <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assessment Average Performance</h3>
                <p className="text-[11px] text-slate-400">Class average score comparison per assessment</p>
              </div>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.performance_trends || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="assessment" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="average" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Student Submissions Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Table Header and Search Filters */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Submitted Student Assessments</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any row to open the complete evaluation view with code diffs, viva breakdown, and plagiarism comparisons.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student or problem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
                />
              </div>

              {/* Plagiarism Status Filter */}
              <select
                value={selectedPlagiarismFilter}
                onChange={(e) => setSelectedPlagiarismFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="all">All Plagiarism Statuses</option>
                <option value="Suspicious">Suspicious</option>
                <option value="Moderate Similarity">Moderate Similarity</option>
                <option value="Clean">Clean</option>
                <option value="Reviewed">Reviewed</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Section Marks (C / V / D)</th>
                  <th className="py-3 px-4">Total Score</th>
                  <th className="py-3 px-4">Test Cases</th>
                  <th className="py-3 px-4">Plagiarism Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                      No matching student submissions found.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/faculty/evaluate/${s.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {s.student_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.student_roll}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs truncate">
                        {s.assessment_title}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {s.submission_date ? new Date(s.submission_date).toLocaleString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        <span className="text-blue-600 font-semibold">{s.coding_marks}</span> /{' '}
                        <span className="text-purple-600 font-semibold">{s.viva_marks}</span> /{' '}
                        <span className="text-amber-600 font-semibold">{s.debugging_marks}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm">{s.total_marks}</span>
                        {s.marks_published && (
                          <span className="ml-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                            Published
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {s.test_cases_passed}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold font-mono ${
                            s.plagiarism_score >= 65 ? 'text-rose-600' :
                            s.plagiarism_score >= 40 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {s.plagiarism_score}%
                          </span>
                          <StatusBadge status={s.plagiarism_status} size="sm" />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          s.faculty_reviewed ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.faculty_reviewed ? 'Reviewed' : 'Needs Review'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/faculty/evaluate/${s.id}`);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="Evaluate Submission"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>
    </div>
  );
};

export default FacultyDashboard;
