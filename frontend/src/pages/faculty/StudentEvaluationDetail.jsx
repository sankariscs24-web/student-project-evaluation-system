import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import CodeEditor from '../../components/CodeEditor';
import StatusBadge from '../../components/StatusBadge';
import {
  ArrowLeft, CheckCircle2, ShieldAlert, Award, Star,
  MessageSquare, Save, Eye, EyeOff, BookOpen, User, Send, Check
} from 'lucide-react';

const StudentEvaluationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Faculty Review State
  const [facultyNotes, setFacultyNotes] = useState('');
  const [facultyFeedback, setFacultyFeedback] = useState('');
  const [scoreAdjustment, setScoreAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [plagiarismStatus, setPlagiarismStatus] = useState('Clean');
  const [marksPublished, setMarksPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/faculty/submission/${id}`);
      const d = res.data;
      setDetail(d);

      // Populate review form state
      setFacultyNotes(d.faculty_review?.notes || '');
      setFacultyFeedback(d.faculty_review?.feedback || '');
      setScoreAdjustment(d.faculty_review?.manual_adjustment || 0);
      setAdjustmentReason(d.faculty_review?.adjustment_reason || '');
      setPlagiarismStatus(d.plagiarism?.status || 'Clean');
      setMarksPublished(d.faculty_review?.marks_published || false);
    } catch (err) {
      setError('Failed to load submission details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReview = async () => {
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await api.post('/faculty/review', {
        submission_id: Number(id),
        faculty_notes: facultyNotes,
        faculty_feedback: facultyFeedback,
        manual_score_adjustment: Number(scoreAdjustment),
        adjustment_reason: adjustmentReason,
        plagiarism_status: plagiarismStatus,
        mark_as_reviewed: true,
      });

      setSaveSuccess('Evaluation review saved successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
      fetchDetail();
    } catch (err) {
      alert('Error saving review: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    const nextState = !marksPublished;
    try {
      await api.post('/faculty/publish', {
        submission_id: Number(id),
        publish: nextState,
      });
      setMarksPublished(nextState);
    } catch (err) {
      alert('Failed to update publication status.');
    }
  };

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

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="p-8 text-center text-rose-600">{error || 'Submission not found'}</div>
      </div>
    );
  }

  const { student, coding_evaluation, viva_evaluation, debugging_evaluation, plagiarism, feedback } = detail;
  const currentTotal = (detail.faculty_review?.total_score || 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      <Navbar />

      {/* Sticky Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              to="/faculty/dashboard"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">
                  {student?.full_name} ({student?.student_id})
                </h1>
                <StatusBadge status={plagiarism?.status} />
                {marksPublished && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Marks Released
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Assessment: <strong className="text-slate-700">{detail.assessment_title}</strong> | Submitted: {detail.submitted_at ? new Date(detail.submitted_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Quick Score and Publish Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Score</div>
              <div className="text-xl font-extrabold text-indigo-600">
                {currentTotal} / {detail.max_marks}
              </div>
            </div>

            <button
              onClick={handleTogglePublish}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
                marksPublished
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {marksPublished ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              <span>{marksPublished ? 'Unpublish Marks' : 'Publish to Student'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Plagiarism Analysis Alert Banner */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          plagiarism?.similarity_score >= 65
            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
            : plagiarism?.similarity_score >= 40
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className={`w-6 h-6 mt-0.5 shrink-0 ${
                plagiarism?.similarity_score >= 65 ? 'text-rose-600' :
                plagiarism?.similarity_score >= 40 ? 'text-amber-600' : 'text-emerald-600'
              }`} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">
                    Plagiarism & Similarity Analysis: {plagiarism?.similarity_score}% Match
                  </h3>
                  <StatusBadge status={plagiarism?.status} />
                </div>
                <p className="text-xs mt-1 leading-relaxed max-w-3xl">
                  {plagiarism?.reports?.[0]?.explanation || 'No structural overlap detected with peer submissions.'}
                </p>
                {plagiarism?.reports?.length > 0 && (
                  <div className="mt-2 text-xs font-semibold">
                    Compared With Peer: <span className="underline">{plagiarism.reports[0].compared_student_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <select
                value={plagiarismStatus}
                onChange={(e) => setPlagiarismStatus(e.target.value)}
                className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Clean">Mark Clean</option>
                <option value="Suspicious">Flag Suspicious</option>
                <option value="Reviewed">Mark Reviewed</option>
                <option value="No Concern">No Significant Concern</option>
              </select>
            </div>
          </div>

          {/* Matched Code Snippets if any */}
          {plagiarism?.reports?.[0]?.matched_snippets?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-200/60">
              <span className="text-xs font-bold uppercase tracking-wider block mb-2">
                Matching Code Regions Detected:
              </span>
              <div className="space-y-2">
                {plagiarism.reports[0].matched_snippets.map((snip, sIdx) => (
                  <div key={sIdx} className="bg-white/90 p-3 rounded-xl border border-rose-200 text-xs font-mono">
                    <div className="text-[11px] text-slate-500 mb-1 font-sans">
                      Lines {snip.source_start}–{snip.source_end} matched with peer lines {snip.target_start}–{snip.target_end}:
                    </div>
                    <pre className="text-rose-700 bg-rose-50/50 p-2 rounded whitespace-pre-wrap">{snip.snippet}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: CODING EVALUATION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Section 1</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Submitted Coding Solution</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Auto Score: </span>
              <span className="text-base font-bold text-blue-600">
                {coding_evaluation?.score} / {coding_evaluation?.max_score} Marks
              </span>
            </div>
          </div>

          {/* Code Viewer in Monaco */}
          <CodeEditor
            code={coding_evaluation?.source_code || '// No code submitted'}
            language={coding_evaluation?.language || 'python'}
            readOnly={true}
            height="320px"
          />

          {/* Test Case Breakdown Table (Including Hidden Test Cases) */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Server Test Case Executions (Visible + Hidden)
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                  <tr>
                    <th className="p-2.5">Case #</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Input</th>
                    <th className="p-2.5">Expected Output</th>
                    <th className="p-2.5">Actual Output</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coding_evaluation?.test_results?.map((tc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-700">Case #{tc.test_case_num}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          tc.is_hidden ? 'bg-purple-100 text-purple-700 font-semibold' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tc.is_hidden ? 'Hidden' : 'Visible'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{tc.input_data}</td>
                      <td className="p-2.5 text-blue-600">{tc.expected_output}</td>
                      <td className="p-2.5 text-slate-800">{tc.actual_output}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          tc.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tc.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">{tc.points_awarded} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 2: VIVA EVALUATION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Section 2</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Viva & Fundamentals Answers</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Auto Score: </span>
              <span className="text-base font-bold text-purple-600">
                {viva_evaluation?.score} / {viva_evaluation?.max_score} Marks
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {viva_evaluation?.questions?.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Q{idx + 1}: {q.question_text}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    q.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {q.score_awarded} / {q.points} pts
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-[11px] text-slate-400 block font-semibold mb-0.5">Student's Answer:</span>
                    <span className="text-slate-800 font-medium">{q.student_answer || 'No answer'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                    <span className="text-[11px] text-emerald-600 block font-semibold mb-0.5">Correct Answer Reference:</span>
                    <span className="text-emerald-900 font-medium">{q.correct_answer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: DEBUGGING EVALUATION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Section 3</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Code Debugging Assessment</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Auto Score: </span>
              <span className="text-base font-bold text-amber-600">
                {debugging_evaluation?.score} / {debugging_evaluation?.max_score} Marks
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Original Faulty Code:</h4>
              <CodeEditor
                code={debugging_evaluation?.faulty_code || ''}
                language={debugging_evaluation?.language || 'python'}
                readOnly={true}
                height="240px"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Student's Corrected Code:</h4>
              <CodeEditor
                code={debugging_evaluation?.corrected_code || ''}
                language={debugging_evaluation?.language || 'python'}
                readOnly={true}
                height="240px"
              />
            </div>
          </div>
        </div>

        {/* STUDENT FEEDBACK SECTION */}
        {feedback && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Feedback Form</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">Student Submitted Experience Ratings</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Overall Difficulty</span>
                <span className="text-lg font-bold text-slate-800">{feedback.overall_rating} / 5</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Question Clarity</span>
                <span className="text-lg font-bold text-slate-800">{feedback.coding_clarity_rating} / 5</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Monaco Editor</span>
                <span className="text-lg font-bold text-slate-800">{feedback.editor_rating} / 5</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Viva Relevance</span>
                <span className="text-lg font-bold text-slate-800">{feedback.viva_relevance_rating} / 5</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Debugging Challenge</span>
                <span className="text-lg font-bold text-slate-800">{feedback.debugging_rating} / 5</span>
              </div>
            </div>

            {feedback.suggestions && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                <strong className="text-slate-900">Student Suggestions: </strong>
                {feedback.suggestions}
              </div>
            )}
            {feedback.additional_comments && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                <strong className="text-slate-900">Additional Comments: </strong>
                {feedback.additional_comments}
              </div>
            )}
          </div>
        )}

        {/* FACULTY REVIEW CONTROLS CARD */}
        <div className="bg-indigo-950 text-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Faculty Evaluation & Grade Publishing Controls</h2>
            <p className="text-xs text-indigo-300 mt-1">
              Add private notes, adjust marks with recorded justification, provide constructive feedback to the student, and publish final marks.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1.5">
                Private Evaluation Notes (Only visible to faculty)
              </label>
              <textarea
                rows={3}
                value={facultyNotes}
                onChange={(e) => setFacultyNotes(e.target.value)}
                placeholder="e.g. Plagiarism similarity investigated; code structure indicates collaboration on hash map lookup..."
                className="w-full bg-slate-900 border border-indigo-900 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1.5">
                Constructive Feedback to Student (Visible after publishing)
              </label>
              <textarea
                rows={3}
                value={facultyFeedback}
                onChange={(e) => setFacultyFeedback(e.target.value)}
                placeholder="e.g. Excellent problem solving on test cases. Keep in mind edge cases regarding empty stack..."
                className="w-full bg-slate-900 border border-indigo-900 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-indigo-900/60">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1.5">
                Manual Score Adjustment (+/- Marks)
              </label>
              <input
                type="number"
                step="0.5"
                value={scoreAdjustment}
                onChange={(e) => setScoreAdjustment(e.target.value)}
                className="w-full bg-slate-900 border border-indigo-900 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1.5">
                Recorded Justification for Adjustment
              </label>
              <input
                type="text"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g. Bonus for clean variable names and comments"
                className="w-full bg-slate-900 border border-indigo-900 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-indigo-900/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-300">Final Total Score: </span>
              <span className="text-xl font-extrabold text-white">
                {Math.max(0, (detail.coding_evaluation?.score || 0) + (detail.viva_evaluation?.score || 0) + (detail.debugging_evaluation?.score || 0) + Number(scoreAdjustment))} / {detail.max_marks}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Evaluation Review'}</span>
              </button>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default StudentEvaluationDetail;
