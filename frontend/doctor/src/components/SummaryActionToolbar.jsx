import React, { useState } from 'react';
import { CheckCircle2, Edit3, XCircle, RotateCcw, AlertCircle, Save, FileCheck } from 'lucide-react';

export const SummaryActionToolbar = ({
  summary,
  onUpdateStatus,
  onSaveAmendment
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
        <div className="bg-white border-2 border-[#0e4d34] rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0e4d34] flex items-center gap-1.5">
              <Edit3 className="w-4 h-4" /> Physician Clinical Note Amendment Mode
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Updating AI-synthesized clinical record
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Physician Consultation Note / Additions:
            </label>
            <input
              type="text"
              value={physicianNote}
              onChange={(e) => setPhysicianNote(e.target.value)}
              placeholder="e.g. Advised USG Abdomen & prescribed Sutshekhar Ras 250mg BD for 14 days..."
              className="w-full px-3.5 py-2.5 bg-[#f4f8f5] border border-[#e2ece5] rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0e4d34] focus:ring-2 focus:ring-[#0e4d34]/15 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Edited Case Summary Text:
            </label>
            <textarea
              rows={6}
              value={amendedText}
              onChange={(e) => setAmendedText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f4f8f5] border border-[#e2ece5] rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0e4d34] focus:ring-2 focus:ring-[#0e4d34]/15 transition resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#0e4d34] hover:bg-[#093322] text-white transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Doctor Amendments
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Box */}
      {showRejectModal && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600" /> Discard or Reject AI Clinical Intake Draft
          </div>
          <p className="text-xs text-slate-600 font-medium">
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
                className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer ${
                  rejectReason === reason
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
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
            className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-medium"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs cursor-pointer"
            >
              Confirm Discard
            </button>
          </div>
        </div>
      )}

      {/* Main Review Status Bar & Action Controls */}
      <div className="bg-white border border-[#e2ece5] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-500 font-bold block mb-1">Clinical Intake Review Status:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {status === 'accepted' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  VERIFIED & APPROVED BY PHYSICIAN
                </span>
              )}
              {status === 'amended' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  AMENDED & SIGNED OFF
                </span>
              )}
              {status === 'rejected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <XCircle className="w-3.5 h-3.5 text-rose-700" />
                  REJECTED / DISCARDED
                </span>
              )}
              {status === 'draft' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#f4f8f5] text-slate-700 border border-[#e2ece5]">
                  <RotateCcw className="w-3.5 h-3.5 text-[#0e4d34]" />
                  PENDING PHYSICIAN SIGN-OFF
                </span>
              )}
              {summary?.last_modified_by && (
                <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                  • {summary.last_modified_by}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            Edit / Amend
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Reject Note
          </button>

          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0e4d34] hover:bg-[#093322] text-white transition shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify & Sign Summary
          </button>
        </div>
      </div>

      {/* Institutional Legal Disclaimer */}
      <p className="text-[11px] text-slate-400 text-center font-medium">
        * MediKiosk summaries are automated clinical intake syntheses aligned with ABDM FHIR & NAMASTE AYUSH standards.
      </p>
    </div>
  );
};

export default SummaryActionToolbar;
