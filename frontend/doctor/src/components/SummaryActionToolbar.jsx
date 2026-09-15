import React, { useState } from 'react';
import { CheckCircle2, Edit3, XCircle, RotateCcw, AlertCircle, Save, FileCheck } from 'lucide-react';

export const SummaryActionToolbar = ({
  summary,
  onUpdateStatus,
  onSaveAmendment,
  onSignOff
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amendedText, setAmendedText] = useState(summary?.draft_text || '');
  const [physicianNote, setPhysicianNote] = useState(summary?.physician_notes || '');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const status = summary?.status || 'draft';

  const handleAccept = () => {
    onUpdateStatus('accepted', physicianNote);
    setIsEditing(false);
    if (onSignOff) {
      onSignOff();
    }
  };

  const handleStartEdit = () => {
    setAmendedText(summary?.draft_text || '');
    setPhysicianNote(summary?.physician_notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onSaveAmendment(amendedText, physicianNote);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setAmendedText(summary?.draft_text || '');
    setPhysicianNote(summary?.physician_notes || '');
    setIsEditing(false);
  };

  const handleConfirmReject = () => {
    onUpdateStatus('rejected', `Doctor rejected note. Reason: ${rejectReason || 'Clinical disparity'}`);
    setShowRejectModal(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Active Edit Area if in Editing mode */}
      {isEditing && (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 rounded-3xl p-6 shadow-2xl shadow-cyan-950/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4" /> Physician Clinical Note Amendment Mode
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Updating AI-synthesized clinical record
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Physician Consultation Note / Additions:
            </label>
            <input
              type="text"
              value={physicianNote}
              onChange={(e) => setPhysicianNote(e.target.value)}
              placeholder="e.g. Advised USG Abdomen & prescribed Sutshekhar Ras 250mg BD for 14 days..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Edited Case Summary Text:
            </label>
            <textarea
              rows={6}
              value={amendedText}
              onChange={(e) => setAmendedText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 hover:from-teal-300 hover:to-cyan-400 transition shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Doctor Amendments
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Box */}
      {showRejectModal && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-rose-400" /> Discard or Reject AI Clinical Intake Draft
          </div>
          <p className="text-xs text-rose-200/80 font-medium">
            Please choose a reason for the clinical audit trail:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Symptom description mismatch',
              'Patient reported new medications',
              'Lab values need re-verification',
              'Routine follow-up case'
            ].map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setRejectReason(reason)}
                className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer ${rejectReason === reason
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-rose-400'
                  }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Or write specific reason..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-400 font-medium"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
            >
              Confirm Discard
            </button>
          </div>
        </div>
      )}

      {/* Main Review Status Bar & Action Controls */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-400 font-bold block mb-1">Clinical Intake Review Status:</span>
            <div className="flex items-center gap-2">
              {status === 'accepted' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Accepted & Verified by Physician</span>
                </span>
              ) : status === 'rejected' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Rejected / Discarded</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Draft Pending Verification</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Amend Note</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 text-slate-400 transition cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Discard Draft</span>
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 hover:from-teal-300 hover:to-cyan-400 transition cursor-pointer shadow-md shadow-cyan-500/25"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Verify & Commit EHR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryActionToolbar;
