import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import StatusBadge from '../../components/StatusBadge';
import {
  ArrowLeft, Plus, Trash2, Eye, EyeOff, Check, X,
  FileCode, HelpCircle, Bug, Send, AlertCircle, Edit3
} from 'lucide-react';

const ManageProblems = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [codingMarks, setCodingMarks] = useState(50);
  const [vivaMarks, setVivaMarks] = useState(25);
  const [dbgMarks, setDbgMarks] = useState(25);
  const [timeLimit, setTimeLimit] = useState(5);

  // Test cases
  const [testCases, setTestCases] = useState([
    { input_data: '', expected_output: '', is_hidden: false, points: 15.0 },
    { input_data: '', expected_output: '', is_hidden: true, points: 10.0 },
  ]);

  // Viva questions
  const [vivaQuestions, setVivaQuestions] = useState([
    {
      question_text: '',
      question_type: 'mcq',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 'Option A',
      points: 5.0,
      category: 'Data Structures'
    }
  ]);

  // Debugging challenge
  const [dbgTitle, setDbgTitle] = useState('Fix Edge Case Bug');
  const [dbgDescription, setDbgDescription] = useState('The code fails when input is empty or contains duplicates.');
  const [dbgCode, setDbgCode] = useState('def solve():\n    pass\n');
  const [dbgExpected, setDbgExpected] = useState('Handle empty cases gracefully without crashing');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/assessments');
      setAssessments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (assessmentId) => {
    try {
      await api.post(`/faculty/assessments/${assessmentId}/publish`);
      fetchAssessments();
    } catch (err) {
      alert('Failed to toggle publish status.');
    }
  };

  const handleDelete = async (assessmentId) => {
    if (confirm('Are you sure you want to delete this assessment? All associated submissions will be removed.')) {
      try {
        await api.delete(`/faculty/assessments/${assessmentId}`);
        fetchAssessments();
      } catch (err) {
        alert('Failed to delete assessment.');
      }
    }
  };

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      { input_data: '', expected_output: '', is_hidden: false, points: 10.0 }
    ]);
  };

  const handleRemoveTestCase = (index) => {
    setTestCases(testCases.filter((_, idx) => idx !== index));
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await api.post('/faculty/assessments', {
        title,
        problem_statement: statement,
        problem_description: description,
        difficulty,
        input_format: inputFormat,
        output_format: outputFormat,
        constraints,
        sample_input: sampleInput,
        sample_output: sampleOutput,
        allowed_languages: ['python', 'c', 'cpp', 'java'],
        max_marks: Number(maxMarks),
        section_marks_coding: Number(codingMarks),
        section_marks_viva: Number(vivaMarks),
        section_marks_debugging: Number(dbgMarks),
        time_limit_sec: Number(timeLimit),
        test_cases: testCases.filter(tc => tc.input_data.trim()),
        viva_questions: vivaQuestions.filter(vq => vq.question_text.trim()),
        debugging_problems: [
          {
            title: dbgTitle,
            description: dbgDescription,
            faulty_code: dbgCode,
            language: 'python',
            expected_behavior: dbgExpected,
            test_cases: [],
            points: Number(dbgMarks)
          }
        ],
        is_published: true,
        assign_all_students: true
      });

      setShowCreateModal(false);
      fetchAssessments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create assessment.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/faculty/dashboard"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Manage Assessment Problems
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Create, configure, publish/unpublish, and version assessment challenges for students.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Problem</span>
          </button>
        </div>

        {/* Assessment Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    a.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    a.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {a.difficulty}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">v{a.version}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{a.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{a.problem_statement}</p>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100 font-medium">
                  <div className="flex justify-between">
                    <span>Total Marks:</span>
                    <strong className="text-slate-800">{a.max_marks} pts</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Coding / Viva / Debug:</span>
                    <span>{a.section_marks_coding} / {a.section_marks_viva} / {a.section_marks_debugging}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Test Cases:</span>
                    <span>{a.test_cases?.length || 0} ({a.test_cases?.filter(t => t.is_hidden).length || 0} Hidden)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => handleTogglePublish(a.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    a.is_published
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {a.is_published ? 'Published' : 'Draft / Unpublished'}
                </button>

                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Assessment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Create Assessment */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900">Create New Assessment Problem</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateAssessment} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Reverse Linked List & Pointer Manipulation"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Timeout (Sec)</label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Statement (Brief)</label>
                  <input
                    type="text"
                    required
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Brief 1-sentence synopsis"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Problem Description</label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed explanation, background and instructions..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Input</label>
                    <textarea
                      rows={2}
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      placeholder="e.g. 5\n1 2 3 4 5"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Output</label>
                    <textarea
                      rows={2}
                      value={sampleOutput}
                      onChange={(e) => setSampleOutput(e.target.value)}
                      placeholder="e.g. 5 4 3 2 1"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Test Cases Section */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Test Cases</span>
                    <button
                      type="button"
                      onClick={handleAddTestCase}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      + Add Test Case
                    </button>
                  </div>

                  <div className="space-y-2">
                    {testCases.map((tc, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="Input stdin..."
                            value={tc.input_data}
                            onChange={(e) => {
                              const updated = [...testCases];
                              updated[idx].input_data = e.target.value;
                              setTestCases(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded font-mono text-[11px]"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Expected stdout..."
                            value={tc.expected_output}
                            onChange={(e) => {
                              const updated = [...testCases];
                              updated[idx].expected_output = e.target.value;
                              setTestCases(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded font-mono text-[11px]"
                          />
                        </div>
                        <div className="col-span-2 flex items-center">
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tc.is_hidden}
                              onChange={(e) => {
                                const updated = [...testCases];
                                updated[idx].is_hidden = e.target.checked;
                                setTestCases(updated);
                              }}
                            />
                            <span>Hidden</span>
                          </label>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveTestCase(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    {creating ? 'Saving & Publishing...' : 'Create & Assign to Students'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ManageProblems;
