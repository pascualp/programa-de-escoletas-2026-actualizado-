import React from 'react';

interface ToastProps {
  message: string;
  isError?: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isError, onClose }) => (
  <div className={`fixed top-24 right-8 p-5 rounded-2xl shadow-2xl z-50 border-b-4 animate-slideIn flex items-center gap-4 transition-all ${
    isError ? 'bg-rose-600 text-white border-rose-800' : 'bg-slate-900 text-blue-400 border-blue-600'
  }`}>
    <div className="flex items-center gap-3">
      {isError ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )}
      <span className="font-black text-xs uppercase tracking-widest">{message}</span>
    </div>
    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  </div>
);
