import React from 'react';

const StatusBadge = ({ status, size = 'sm' }) => {
  if (!status) return null;
  const s = status.toLowerCase();

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  if (s === 'passed' || s === 'clean' || s === 'graded' || s === 'reviewed' || s === 'submitted') {
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
        {status}
      </span>
    );
  }

  if (s === 'suspicious' || s === 'failed') {
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
        {status}
      </span>
    );
  }

  if (s === 'in progress' || s === 'pending review' || s === 'moderate similarity') {
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
      {status}
    </span>
  );
};

export default StatusBadge;
