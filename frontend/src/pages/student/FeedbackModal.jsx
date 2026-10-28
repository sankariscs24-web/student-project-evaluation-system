import React, { useState } from 'react';
import api from '../../services/api';
import { Star, CheckCircle2, MessageSquare, Send } from 'lucide-react';

const RatingInput = ({ label, value, onChange, description }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0 gap-2">
      <div>
        <div className="text-xs font-semibold text-slate-800">{label}</div>
        {description && <div className="text-[11px] text-slate-400">{description}</div>}
      </div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none ${
              star <= value ? 'text-amber-400' : 'text-slate-200 hover:text-slate-300'
            }`}
          >
            <Star className={`w-5 h-5 ${star <= value ? 'fill-amber-400' : ''}`} />
          </button>
        ))}
        <span className="text-xs font-bold text-slate-600 ml-2 w-4 text-center">{value}</span>
      </div>
    </div>
  );
};

const FeedbackModal = ({ isOpen, assessmentId, onClose, onFeedbackSubmitted }) => {
  const [overall, setOverall] = useState(5);
  const [codingClarity, setCodingClarity] = useState(5);
  const [editorExperience, setEditorExperience] = useState(5);
  const [vivaRelevance, setVivaRelevance] = useState(4);
  const [debuggingDiff, setDebuggingDiff] = useState(4);
  const [suggestions, setSuggestions] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/student/feedback', {
        assessment_id: assessmentId,
        overall_rating: overall,
        coding_clarity_rating: codingClarity,
        editor_rating: editorExperience,
        viva_relevance_rating: vivaRelevance,
        debugging_rating: debuggingDiff,
        suggestions: suggestions.trim() || null,
        additional_comments: comments.trim() || null,
      });
      setSubmitted(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Thank You for Your Feedback!</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
              Your evaluation feedback has been recorded securely for faculty review to help improve future assessment design.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
            >
              Close & View Results
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Assessment Feedback</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Student Experience Evaluation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Please rate your experience across each assessment component (1 = Poor, 5 = Excellent).
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <RatingInput
                label="Overall Assessment Difficulty"
                description="Was the difficulty level appropriate?"
                value={overall}
                onChange={setOverall}
              />
              <RatingInput
                label="Coding Question Clarity"
                description="Clarity of problem statement and constraints"
                value={codingClarity}
                onChange={setCodingClarity}
              />
              <RatingInput
                label="Monaco Code Editor Experience"
                description="Syntax highlighting, responsiveness & run features"
                value={editorExperience}
                onChange={setEditorExperience}
              />
              <RatingInput
                label="Viva Question Relevance"
                description="Alignment with data structures & fundamentals"
                value={vivaRelevance}
                onChange={setVivaRelevance}
              />
              <RatingInput
                label="Debugging Challenge Difficulty"
                description="Clarity of faulty code and debugging task"
                value={debuggingDiff}
                onChange={setDebuggingDiff}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Suggestions for Improvement (Optional)
              </label>
              <textarea
                rows={2}
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="Share any suggestions to improve the coding questions or editor..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Comments
              </label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any other notes regarding execution time, test cases, or viva..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {loading ? 'Submitting...' : (
                  <>
                    <span>Submit Feedback</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default FeedbackModal;
