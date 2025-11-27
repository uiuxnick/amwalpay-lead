import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { AIService } from '../services/ai';

interface AiScoreModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const AiScoreModal: React.FC<AiScoreModalProps> = ({ lead, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      setScore(0);
      setJustification('');
      
      AIService.getLeadScore(lead)
        .then(result => {
          setScore(result.score);
          setJustification(result.justification);
        })
        .catch(err => {
          setError(err.message || "An unknown error occurred.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, lead]);

  if (!isOpen) return null;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22c55e'; // green-500
    if (s >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-grow" onClick={onClose}>
      <div className="glassmorphism rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary"><path d="M10 3a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 0110 3z" /><path fillRule="evenodd" d="M11.49 2.176a.75.75 0 01.425.86l-.667 2.667.618.309a.75.75 0 01.353.946l-1.5 3a.75.75 0 01-1.22.257l-.34-.425a.75.75 0 01.03-1.06l1.373-1.372-1.25-5a.75.75 0 01.86-.425zM4.74 3.428a.75.75 0 01.86.425l1.25 5-1.373 1.372a.75.75 0 11-1.09-1.03l.34-.425a.75.75 0 011.22-.257l1.5 3a.75.75 0 01-.353.946l-.618.31-2.667-.668a.75.75 0 01-.425.861 8 8 0 1010.87-6.924.75.75 0 01.21-1.044 8 8 0 00-10.87 6.924z" clipRule="evenodd" /></svg>
                       AI Lead Insights
                    </h2>
                    <p className="text-sm text-slate-500">Analysis powered by Gemini</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
            </div>
            
            <div className="my-8 flex flex-col items-center justify-center text-center">
                {loading ? (
                    <>
                        <div className="w-24 h-24 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm text-slate-500 font-medium">Analyzing lead data...</p>
                    </>
                ) : error ? (
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                        <p className="font-bold">Analysis Failed</p><p className="text-xs mt-1">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-slate-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                <circle
                                  style={{ stroke: scoreColor }}
                                  className="transition-all duration-1000 ease-out"
                                  strokeWidth="10"
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r="45"
                                  cx="50"
                                  cy="50"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={offset}
                                  transform="rotate(-90 50 50)"
                                />
                                <text x="50" y="50" fontFamily="Inter" fontSize="24" fontWeight="800" textAnchor="middle" dy=".3em" style={{ fill: scoreColor }}>
                                    {score}
                                </text>
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider -mt-2">Lead Score</p>
                        <p className="mt-4 max-w-sm text-base text-slate-700 italic px-4">"{justification}"</p>
                    </>
                )}
            </div>
        </div>
        <div className="bg-slate-50/50 p-4 border-t border-slate-200/80 flex justify-end">
             <button onClick={onClose} className="px-5 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-bold">
               Close
             </button>
        </div>
      </div>
    </div>
  );
};
