import React from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Copy, Check } from 'lucide-react';

const LANGUAGE_MAP = {
  python: 'python',
  c: 'c',
  cpp: 'cpp',
  java: 'java'
};

const CodeEditor = ({
  code,
  onChange,
  language = 'python',
  onLanguageChange,
  onReset,
  allowedLanguages = ['python', 'c', 'cpp', 'java'],
  readOnly = false,
  height = '480px',
  theme = 'vs-dark'
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col border border-slate-700/80 rounded-xl overflow-hidden bg-slate-900 shadow-md">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-300">Editor</span>
          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={readOnly}
              className="bg-slate-800 text-blue-400 font-medium px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wider text-[11px]"
            >
              {allowedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'cpp' ? 'C++' : lang.toUpperCase()}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title="Reset Code Template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Container */}
      <div className="w-full" style={{ height }}>
        <Editor
          height="100%"
          language={LANGUAGE_MAP[language.toLowerCase()] || 'python'}
          value={code}
          theme={theme}
          onChange={(val) => onChange && onChange(val || '')}
          options={{
            readOnly: readOnly,
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 4,
            folding: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            renderLineHighlight: 'all',
          }}
          loading={
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading Monaco Editor...
            </div>
          }
        />
      </div>
    </div>
  );
};

export default CodeEditor;
