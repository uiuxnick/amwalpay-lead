import React from 'react';

interface FilePreviewModalProps {
  file: File | null;
  fileUrl?: string; // Base64 or URL
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, fileUrl, fileName, isOpen, onClose }) => {
  if (!isOpen) return null;

  const previewUrl = file ? URL.createObjectURL(file) : fileUrl;
  const isPdf = fileName.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-modal-grow">
      <div className="glassmorphism rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-inherit">
           <h3 className="font-bold text-slate-800 dark:text-white truncate pr-4">Preview: {fileName}</h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900/50 p-4 flex items-center justify-center">
           {!previewUrl ? (
             <div className="text-slate-500 dark:text-slate-400">Preview not available.</div>
           ) : (
             <>
               {isImage && <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain shadow-lg rounded-lg" />}
               {isPdf && <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg shadow-lg bg-white" title="PDF Preview"></iframe>}
               {!isImage && !isPdf && (
                 <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow">
                   <p className="text-lg mb-4">Cannot preview this file type.</p>
                 </div>
               )}
             </>
           )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-inherit flex justify-end gap-3">
             {previewUrl && (
                <a 
                  href={previewUrl} 
                  download={fileName} 
                  className="px-4 py-2 primary-gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-bold"
                >
                  Download
                </a>
             )}
             <button onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-bold">
               Close
             </button>
        </div>
      </div>
    </div>
  );
};
