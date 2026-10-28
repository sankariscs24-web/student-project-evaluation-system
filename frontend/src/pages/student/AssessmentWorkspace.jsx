import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import CodeEditor from '../../components/CodeEditor';
import FeedbackModal from './FeedbackModal';
import confetti from 'canvas-confetti';
import {
  Code, HelpCircle, Bug, CheckCircle2, AlertCircle, Play,
  RotateCcw, ArrowLeft, ArrowRight, ShieldAlert, Award,
  Check, Lock, ExternalLink, HelpCircle as QuestionIcon, AlertTriangle
} from 'lucide-react';

const AssessmentWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(1); // 1: Coding, 2: Viva, 3: Debugging
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');

  // Section 1: Coding State
  const [codingCode, setCodingCode] = useState('');
  const [codingLanguage, setCodingLanguage] = useState('python');
  const [codingRunning, setCodingRunning] = useState(false);
  const [codingResults, setCodingResults] = useState(null);
  const [codingSaveMsg, setCodingSaveMsg] = useState('');

  // Section 2: Viva State
  const [vivaCurrentIdx, setVivaCurrentIdx] = useState(0);
  const [vivaAnswers, setVivaAnswers] = useState({});
  const [vivaSaving, setVivaSaving] = useState(false);
  const [vivaSaveMsg, setVivaSaveMsg] = useState('');

  // Section 3: Debugging State
  const [debuggingCode, setDebuggingCode] = useState('');
  const [debuggingLanguage, setDebuggingLanguage] = useState('python');
  const [debuggingRunning, setDebuggingRunning] = useState(false);
  const [debuggingResults, setDebuggingResults] = useState(null);
  const [debuggingSaveMsg, setDebuggingSaveMsg] = useState('');

  // Section Completion Indicators
  const [section1Done, setSection1Done] = useState(false);
  const [section2Done, setSection2Done] = useState(false);
  const [section3Done, setSection3Done] = useState(false);

  // Final Submit
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false);
  const [finalResultData, setFinalResultData] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/student/assessment/${id}`);
      const ws = res.data;
      setWorkspace(ws);

      // Section 1 data
      setCodingCode(ws.saved_code || getDefaultTemplate(ws.saved_language || 'python'));
      setCodingLanguage(ws.saved_language || 'python');
      if (ws.coding_test_results && ws.coding_test_results.length > 0) {
        setCodingResults({ test_results: ws.coding_test_results });
      }
      setSection1Done(ws.section1_completed);

      // Section 2 data
      setVivaAnswers(ws.viva_answers || {});
      setSection2Done(ws.section2_completed);

      // Section 3 data
      const defaultDbg = ws.debugging_problem?.faulty_code || '';
      setDebuggingCode(ws.saved_debugging_code || defaultDbg);
      setDebuggingLanguage(ws.saved_debugging_language || 'python');
      if (ws.debugging_test_results && ws.debugging_test_results.length > 0) {
        setDebuggingResults({ test_results: ws.debugging_test_results });
      }
      setSection3Done(ws.section3_completed);

      setIsFinalSubmitted(ws.is_final_submitted);
    } catch (err) {
      setError('Unable to load assessment workspace.');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTemplate = (lang) => {
    switch (lang.toLowerCase()) {
      case 'c':
        return '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}\n';
      case 'cpp':
        return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n';
      case 'java':
        return 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n';
      default:
        return 'import sys\n\ndef solve():\n    # Read input from sys.stdin\n    lines = sys.stdin.read().strip().split("\\n")\n    # Implement solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n';
    }
  };

  const handleLanguageChange = (newLang) => {
    setCodingLanguage(newLang);
    // If empty or unmodified default, replace with new template
    if (!codingCode.trim() || codingCode.includes('Write your code here') || codingCode.includes('Implement solution here')) {
      setCodingCode(getDefaultTemplate(newLang));
    }
  };

  // Run Coding Section
  const handleRunCode = async () => {
    if (isFinalSubmitted) return;
    setCodingRunning(true);
    setCodingSaveMsg('');
    try {
      const res = await api.post('/student/run-code', {
        assessment_id: Number(id),
        source_code: codingCode,
        language: codingLanguage,
        run_test_cases: true,
      });
      setCodingResults(res.data);
      setSection1Done(true);
      setCodingSaveMsg('Code executed and draft saved successfully!');
      setTimeout(() => setCodingSaveMsg(''), 4000);
    } catch (err) {
      setCodingSaveMsg('Execution failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCodingRunning(false);
    }
  };

  // Reset Coding Code
  const handleResetCoding = () => {
    if (confirm('Reset your editor to the default template? Your unsaved edits will be cleared.')) {
      setCodingCode(getDefaultTemplate(codingLanguage));
    }
  };

  // Viva Answer Select / Input
  const handleVivaAnswerChange = (qId, answer) => {
    if (isFinalSubmitted) return;
    const updated = { ...vivaAnswers, [qId]: answer };
    setVivaAnswers(updated);

    // Auto check completion
    const qCount = workspace?.viva_questions?.length || 0;
    const answeredCount = Object.keys(updated).filter((k) => updated[k]?.trim()).length;
    if (answeredCount >= qCount && qCount > 0) {
      setSection2Done(true);
    }
  };

  // Save Viva Section
  const handleSaveViva = async () => {
    if (isFinalSubmitted) return;
    setVivaSaving(true);
    setVivaSaveMsg('');
    try {
      const answerList = Object.entries(vivaAnswers).map(([qId, ans]) => ({
        question_id: Number(qId),
        answer: ans,
      }));

      const res = await api.post('/student/save-viva', {
        assessment_id: Number(id),
        answers: answerList,
      });

      setSection2Done(res.data.section2_completed);
      setVivaSaveMsg(`Viva progress saved (${res.data.answered_count}/${res.data.total_questions} answered)`);
      setTimeout(() => setVivaSaveMsg(''), 4000);
    } catch (err) {
      setVivaSaveMsg('Error saving viva answers: ' + (err.response?.data?.detail || err.message));
    } finally {
      setVivaSaving(false);
    }
  };

  // Run Debugging Section
  const handleRunDebugging = async () => {
    if (isFinalSubmitted) return;
    setDebuggingRunning(true);
    setDebuggingSaveMsg('');
    try {
      const res = await api.post('/student/run-debugging', {
        assessment_id: Number(id),
        source_code: debuggingCode,
        language: debuggingLanguage,
        run_test_cases: true,
      });
      setDebuggingResults(res.data);
      setSection3Done(true);
      setDebuggingSaveMsg('Debugging code executed and saved!');
      setTimeout(() => setDebuggingSaveMsg(''), 4000);
    } catch (err) {
      setDebuggingSaveMsg('Debugging run failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDebuggingRunning(false);
    }
  };

  const handleResetDebugging = () => {
    if (confirm('Reset to the original faulty code?')) {
      setDebuggingCode(workspace?.debugging_problem?.faulty_code || '');
    }
  };

  // Check if all 3 sections are ready for Final Submit
  const isAllSectionsCompleted = section1Done && section2Done && section3Done;

  // Final Submit Action
  const handleFinalSubmit = async () => {
    setSubmittingFinal(true);
    try {
      // Ensure latest viva is saved
      await handleSaveViva();

      const res = await api.post(`/student/final-submit?assessment_id=${id}`);
      setFinalResultData(res.data);
      setIsFinalSubmitted(true);
      setShowConfirmModal(false);

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      // Prompt Feedback Form
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to finalize assessment submission.');
    } finally {
      setSubmittingFinal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const assessment = workspace?.assessment;
  const currentVivaQ = workspace?.viva_questions?.[vivaCurrentIdx];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      <Navbar />

      {/* Top Bar: Assessment Title & Tab Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              to="/student/dashboard"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {assessment?.title}
                </h1>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  assessment?.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  assessment?.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {assessment?.difficulty}
                </span>
                {isFinalSubmitted && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked & Submitted
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Max Marks: {assessment?.max_marks} (Coding: {assessment?.section_marks_coding} | Viva: {assessment?.section_marks_viva} | Debugging: {assessment?.section_marks_debugging})
              </div>
            </div>
          </div>

          {/* Section Tabs with Completion Checkmarks */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab(1)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 1
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Section 1: Coding</span>
              {section1Done ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab(2)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 2
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Section 2: Viva</span>
              {section2Done ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab(3)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 3
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Section 3: Debugging</span>
              {section3Done ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>
          </div>

          {/* Final Submit Trigger */}
          <div className="flex items-center gap-2">
            {!isFinalSubmitted ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!isAllSectionsCompleted}
                title={!isAllSectionsCompleted ? "Complete all 3 sections to enable final submit" : "Final Submit"}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md ${
                  isAllSectionsCompleted
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                <span>Final Submit</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Provide Feedback</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:px-6">
        
        {/* ========================================================================= */}
        {/* SECTION 1: CODING CHALLENGE */}
        {/* ========================================================================= */}
        {activeTab === 1 && (
          <div className="flex flex-col gap-4">
            
            {/* Top row: Left Problem Spec + Right Monaco Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Panel: Problem Statement */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-y-auto max-h-[580px] shadow-sm">
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                    Problem Description
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{assessment?.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 italic">{assessment?.problem_statement}</p>
                </div>

                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                      Full Description
                    </h3>
                    <div className="whitespace-pre-line text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {assessment?.problem_description}
                    </div>
                  </div>

                  {assessment?.input_format && (
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">Input Format:</h4>
                      <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap">
                        {assessment.input_format}
                      </pre>
                    </div>
                  )}

                  {assessment?.output_format && (
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">Output Format:</h4>
                      <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap">
                        {assessment.output_format}
                      </pre>
                    </div>
                  )}

                  {assessment?.constraints && (
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">Constraints:</h4>
                      <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-amber-300/80 whitespace-pre-wrap">
                        {assessment.constraints}
                      </pre>
                    </div>
                  )}

                  {assessment?.sample_input && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <h4 className="font-semibold text-slate-200 mb-1">Sample Input:</h4>
                        <pre className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-emerald-400">
                          {assessment.sample_input}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 mb-1">Sample Output:</h4>
                        <pre className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-blue-400">
                          {assessment.sample_output}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Monaco Editor & Controls */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <CodeEditor
                  code={codingCode}
                  onChange={setCodingCode}
                  language={codingLanguage}
                  onLanguageChange={handleLanguageChange}
                  onReset={handleResetCoding}
                  allowedLanguages={assessment?.allowed_languages || ['python', 'c', 'cpp', 'java']}
                  readOnly={isFinalSubmitted}
                  height="450px"
                />

                {/* Editor Action Bar */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-400">
                    {codingSaveMsg ? (
                      <span className="text-emerald-400 font-medium">{codingSaveMsg}</span>
                    ) : (
                      <span>Time limit: {assessment?.time_limit_sec || 5}s | Isolated Sandbox</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunCode}
                      disabled={codingRunning || isFinalSubmitted}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                      {codingRunning ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Executing In Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run Code & Evaluate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Panel: Predefined Test Cases Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Test Case Validation Results</span>
                    {codingResults && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        codingResults.passed_cases === codingResults.total_cases
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {codingResults.passed_cases} / {codingResults.total_cases} Passed ({codingResults.score} Marks)
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluated inside an isolated Windows runner. Hidden test cases preserve institutional evaluation integrity.
                  </p>
                </div>
              </div>

              {codingResults?.compile_error && (
                <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-mono">
                  <div className="font-bold text-rose-400 mb-1">Compilation / Execution Error:</div>
                  <pre className="whitespace-pre-wrap">{codingResults.compile_error}</pre>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-950/60">
                      <th className="py-2.5 px-3">Test Case</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Input</th>
                      <th className="py-2.5 px-3">Expected Output</th>
                      <th className="py-2.5 px-3">Actual Output</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {/* If execution ran, show execution results; otherwise show initial visible test cases */}
                    {(codingResults?.test_results || workspace?.test_cases || []).map((tc, idx) => {
                      const isExecuted = tc.passed !== undefined;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 font-mono">
                          <td className="py-2.5 px-3 text-slate-300 font-semibold">
                            Case #{tc.test_case_num || idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              tc.is_hidden ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {tc.is_hidden ? 'Hidden' : 'Visible'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                            {tc.is_hidden && !tc.input_data ? (
                              <span className="text-slate-500 italic">[Protected Input]</span>
                            ) : (
                              tc.input_data || '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-blue-300 max-w-xs truncate">
                            {tc.is_hidden && !tc.expected_output ? (
                              <span className="text-slate-500 italic">[Protected Output]</span>
                            ) : (
                              tc.expected_output || '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 max-w-xs truncate">
                            {isExecuted ? (
                              tc.actual_output || (tc.passed ? '[Passed]' : '[Failed]')
                            ) : (
                              <span className="text-slate-500 italic">Not executed yet</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {isExecuted ? (
                              <span className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                                tc.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {tc.passed ? 'PASS' : 'FAIL'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Ready</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-300">
                            {isExecuted ? `${tc.points_awarded || 0} pts` : `${tc.points} pts`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: VIVA AND PROGRAMMING FUNDAMENTALS */}
        {/* ========================================================================= */}
        {activeTab === 2 && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                      Section 2 — Viva & Conceptual Assessment
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Total Weight: {assessment?.section_marks_viva} Marks
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">Programming Fundamentals & Data Structures</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Answer all viva questions. Answers are saved automatically and evaluated against the question bank.
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Progress</div>
                  <div className="text-lg font-bold text-blue-400">
                    Question {vivaCurrentIdx + 1} of {workspace?.viva_questions?.length || 0}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-5 border border-slate-800">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                  style={{
                    width: `${((Object.keys(vivaAnswers).filter(k => vivaAnswers[k]?.trim()).length) / (workspace?.viva_questions?.length || 1)) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Active Question Display Card */}
            {currentVivaQ && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                  <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {currentVivaQ.category || 'Fundamentals'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {currentVivaQ.points} Marks ({currentVivaQ.question_type.toUpperCase()})
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-medium text-slate-100 mb-6 leading-relaxed">
                  {currentVivaQ.question_text}
                </h3>

                {/* Multiple Choice Options */}
                {currentVivaQ.question_type === 'mcq' && currentVivaQ.options && (
                  <div className="space-y-3">
                    {currentVivaQ.options.map((option, idx) => {
                      const isSelected = vivaAnswers[currentVivaQ.id] === option;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleVivaAnswerChange(currentVivaQ.id, option)}
                          disabled={isFinalSubmitted}
                          className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-md'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                              isSelected ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-700 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer Input */}
                {currentVivaQ.question_type === 'short_answer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Your Technical Answer / Explanation:
                    </label>
                    <textarea
                      rows={4}
                      value={vivaAnswers[currentVivaQ.id] || ''}
                      onChange={(e) => handleVivaAnswerChange(currentVivaQ.id, e.target.value)}
                      disabled={isFinalSubmitted}
                      placeholder="Type your explanation using relevant terminology, time/space complexity, and data structure principles..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Navigation and Save Controls */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-6 mt-6">
                  <button
                    onClick={() => setVivaCurrentIdx(Math.max(0, vivaCurrentIdx - 1))}
                    disabled={vivaCurrentIdx === 0}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous Question</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveViva}
                      disabled={vivaSaving || isFinalSubmitted}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-blue-400 transition-colors"
                    >
                      {vivaSaving ? 'Saving...' : 'Save Progress'}
                    </button>

                    <button
                      onClick={() => setVivaCurrentIdx(Math.min((workspace?.viva_questions?.length || 1) - 1, vivaCurrentIdx + 1))}
                      disabled={vivaCurrentIdx === (workspace?.viva_questions?.length || 1) - 1}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {vivaSaveMsg && (
                  <div className="mt-3 text-center text-xs text-emerald-400">
                    {vivaSaveMsg}
                  </div>
                )}

              </div>
            )}

            {/* Question Quick Jump Badges */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-2">Jump to Question:</span>
              {workspace?.viva_questions?.map((q, idx) => {
                const isAnswered = Boolean(vivaAnswers[q.id]?.trim());
                return (
                  <button
                    key={q.id}
                    onClick={() => setVivaCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                      vivaCurrentIdx === idx
                        ? 'bg-blue-600 text-white border-blue-400 scale-105'
                        : isAnswered
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: CODE DEBUGGING CHALLENGE */}
        {/* ========================================================================= */}
        {activeTab === 3 && (
          <div className="flex flex-col gap-4">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Panel: Debugging Question & Expected Behavior */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-y-auto max-h-[580px] shadow-sm">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                      Section 3 — Code Debugging
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {assessment?.section_marks_debugging} Marks
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {workspace?.debugging_problem?.title || 'Correct the Defective Implementation'}
                  </h2>
                </div>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="bg-rose-950/30 border border-rose-800/60 p-4 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-rose-400 mb-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Bug Description:</span>
                    </div>
                    <p className="leading-relaxed text-rose-200/90">
                      {workspace?.debugging_problem?.description}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="font-bold text-slate-200 mb-1.5 text-xs uppercase tracking-wider">
                      Expected Correct Behavior:
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      {workspace?.debugging_problem?.expected_behavior}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 italic">
                    Tip: Read the faulty code carefully in the editor on the right, identify the logical or boundary flaw, fix it, and click "Run & Test Corrected Code".
                  </div>
                </div>
              </div>

              {/* Right Panel: Monaco Editor for Corrected Code */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <CodeEditor
                  code={debuggingCode}
                  onChange={setDebuggingCode}
                  language={debuggingLanguage}
                  onReset={handleResetDebugging}
                  readOnly={isFinalSubmitted}
                  height="450px"
                />

                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-400">
                    {debuggingSaveMsg ? (
                      <span className="text-emerald-400 font-medium">{debuggingSaveMsg}</span>
                    ) : (
                      <span>Fix the code and click Run & Test</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRunDebugging}
                    disabled={debuggingRunning || isFinalSubmitted}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    {debuggingRunning ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Evaluating Fix...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run & Test Corrected Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Panel: Debugging Test Case Results */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-2">Debugging Test Case Results</h3>
              <p className="text-xs text-slate-400 mb-4">
                Verify whether your corrected logic satisfies the problem's functional requirements.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-950/60 font-mono">
                      <th className="py-2.5 px-3">Test Case</th>
                      <th className="py-2.5 px-3">Input</th>
                      <th className="py-2.5 px-3">Expected Output</th>
                      <th className="py-2.5 px-3">Your Output</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {(debuggingResults?.test_results || workspace?.debugging_problem?.test_cases || []).map((tc, idx) => {
                      const isExecuted = tc.passed !== undefined;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-300">
                            Case #{tc.test_case_num || idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{tc.input_data || tc.input || '—'}</td>
                          <td className="py-2.5 px-3 text-blue-300">{tc.expected_output || tc.expected || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-200">
                            {isExecuted ? tc.actual_output : <span className="text-slate-500 italic">Not tested</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            {isExecuted ? (
                              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                tc.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {tc.passed ? 'PASS' : 'FAIL'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Confirmation Modal Before Final Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Confirm Final Assessment Submission</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              You are about to submit and lock your assessment. Once confirmed:
            </p>

            <ul className="text-xs text-slate-300 space-y-1.5 my-4 pl-4 list-disc">
              <li>Your Section 1 code will be locked and graded on server test cases.</li>
              <li>Your Section 2 viva answers will be recorded.</li>
              <li>Your Section 3 debugging code will be finalized.</li>
              <li>Automated plagiarism analysis will run across all submissions.</li>
              <li>You will be directed to the student feedback evaluation form.</li>
            </ul>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel & Review
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submittingFinal}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                {submittingFinal ? 'Submitting & Grading...' : 'Confirm Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Feedback Form Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        assessmentId={Number(id)}
        onClose={() => setShowFeedbackModal(false)}
        onFeedbackSubmitted={() => {
          setShowFeedbackModal(false);
          fetchWorkspace();
        }}
      />

    </div>
  );
};

export default AssessmentWorkspace;
