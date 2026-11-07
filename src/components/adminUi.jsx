import React from 'react';
import { RefreshCw } from 'lucide-react';

// Các khối giao diện dùng chung cho trang admin

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-cocoa-900 md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-cocoa-400">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export const Card = ({ className = '', children }) => (
  <div className={`rounded-3xl bg-white p-5 shadow-card ${className}`}>{children}</div>
);

export const Segmented = ({ options, value, onChange }) => (
  <div className="flex rounded-full bg-white p-1 shadow-card">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
          value === opt.value ? 'bg-blush-500 text-white' : 'text-cocoa-500 hover:text-blush-700'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export const RefreshButton = ({ onClick, loading }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blush-700 shadow-card hover:bg-blush-100"
  >
    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
  </button>
);

export const EmptyState = ({ emoji = '🌸', text }) => (
  <div className="rounded-3xl border-2 border-dashed border-blush-200 py-14 text-center">
    <div className="text-4xl">{emoji}</div>
    <p className="mt-2 text-sm font-semibold text-cocoa-400">{text}</p>
  </div>
);
