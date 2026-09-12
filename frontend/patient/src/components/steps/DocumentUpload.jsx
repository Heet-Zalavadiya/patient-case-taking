import React, { useState, useRef } from 'react';
import { usePatient } from '../../context/PatientContext';
import {
  apiUploadDocument,
  apiGetPatientDocuments,
  uploadDocument,
  uploadMedicalDocument,
  getPatientDocuments
} from '../../services/api';
import {
  UploadCloud,
  Camera,
  FileText,
  FileCheck2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Clock,
  Eye,
  Paperclip,
  Check,
  Stethoscope,
  ScanLine,
  Pill,
  RotateCw,
  X
} from 'lucide-react';

export const DocumentUpload = () => {
  const {
    patientData,
    theme,
    addUploadedDocument,
    updateUploadedDocument,
    removeUploadedDocument,
    nextStep,
    prevStep
  } = usePatient();

  const isLight = theme === 'light';

  // State
  const [selectedDocType, setSelectedDocType] = useState('prescription'); // 'prescription' | 'lab_report' | 'discharge_summary'
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Live Camera State (Option B with Option A capture input fallback)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [availableVideoDevices, setAvailableVideoDevices] = useState([]);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  const uploadedDocs = patientData.uploaded_documents || [];

  // Stop camera stream safely
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  // Open live device camera with fallback
  const handleOpenCamera = async (preferredFacingMode = facingMode) => {
    setCameraError(null);

    // If getUserMedia is not supported in this browser/context, fall back to native capture input
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
        return;
      }
      setCameraError(
        'Camera access is needed to scan your document. Please allow camera access or use "Touch Here to Upload" instead.'
      );
      return;
    }

    try {
      // Check available video devices
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setAvailableVideoDevices(videoInputs);
        } catch (e) {
          // ignore
        }
      }

      // Stop existing stream before opening new one
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: preferredFacingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback to basic video constraint if ideal facingMode fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      console.warn('[DocumentUpload] getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera access is needed to scan your document. Please allow camera access or use "Touch Here to Upload" instead.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          'No camera was detected on this device. Please connect a webcam or use "Touch Here to Upload" instead.'
        );
      } else {
        setCameraError(
          'Camera access is needed to scan your document. Please allow camera access or use "Touch Here to Upload" instead.'
        );
      }
    }
  };

  // Sync camera stream to video element when modal mounts
  React.useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen, cameraStream]);

  // Clean up stream on unmount
  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Toggle between front and rear camera
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    handleOpenCamera(nextMode);
  };

  // Capture video frame from canvas and feed into existing document processor
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            stopCamera();
            return;
          }
          const capturedFile = new File(
            [blob],
            `Camera_${selectedDocType}_${Date.now()}.jpg`,
            { type: 'image/jpeg' }
          );
          stopCamera();
          handleProcessFile(capturedFile);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Error capturing photo from canvas:', err);
      stopCamera();
    }
  };

  // Document Type Definitions
  const docTypes = [
    {
      id: 'prescription',
      label: 'दवाई की पर्ची / Prescription',
      desc: 'Doctor prescription, dosage slips',
      icon: Stethoscope
    },
    {
      id: 'lab_report',
      label: 'जांच रिपोर्ट / Lab Report',
      desc: 'Blood tests, X-rays, pathology',
      icon: FileText
    },
    {
      id: 'discharge_summary',
      label: 'डिस्चार्ज समरी / Discharge Summary',
      desc: 'Hospital discharge, surgical notes',
      icon: FileCheck2
    }
  ];

  // Handle file selection (from file picker, drag-and-drop, or camera capture)
  const handleProcessFile = async (file) => {
    if (!file) return;

    setIsUploading(true);

    const docId = `doc_${Date.now()}`;
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

    // Initial document record with 'pending' OCR status
    const newDoc = {
      id: docId,
      document_id: docId,
      name: file.name || `${selectedDocType}_${new Date().toLocaleTimeString()}.jpg`,
      document_type: selectedDocType,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      preview_url: previewUrl,
      ocr_status: 'pending',
      uploaded_at: new Date().toISOString()
    };

    addUploadedDocument(newDoc);

    // 1. Construct FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientData.patient_id || 1);
    if (patientData.session_id) {
      formData.append('session_id', patientData.session_id);
    }
    formData.append('document_type', selectedDocType);

    const effectivePatientId = patientData.patient_id || 1;
    let isCompleted = false;

    // 2. Call apiUploadDocument with the real uploaded file
    try {
      const uploadRes = await apiUploadDocument(formData);
      if (uploadRes) {
        const meds = Array.isArray(uploadRes.extracted_medications) ? uploadRes.extracted_medications : [];
        const rawText = uploadRes.ocr_raw_text || (meds.length > 0
          ? 'Clinical findings and medications extracted.'
          : 'Could not extract clear information from this document. Please verify manually.');
        const status = uploadRes.ocr_status || (meds.length > 0 ? 'processed' : 'failed');

        isCompleted = true;
        updateUploadedDocument(docId, {
          ocr_status: status,
          ocr_text: rawText,
          extracted_medications: meds
        });
      }
    } catch (err) {
      console.warn('Upload API note:', err.message);
      isCompleted = true;
      updateUploadedDocument(docId, {
        ocr_status: 'failed',
        ocr_text: 'Could not extract clear information from this document. Please verify manually.',
        extracted_medications: []
      });
    } finally {
      setIsUploading(false);
    }

    // 3. Optional fallback polling only if document status was left pending
    if (!isCompleted) {
      let pollAttempts = 0;
      const pollInterval = setInterval(async () => {
        pollAttempts += 1;
        try {
          const patientDocs = await apiGetPatientDocuments(effectivePatientId);
          if (Array.isArray(patientDocs) && patientDocs.length > 0) {
            const match = patientDocs.find(d => d.document_id === docId || d.document_type === selectedDocType) || patientDocs[0];
            if (match && (match.ocr_status === 'processed' || match.ocr_status === 'failed')) {
              clearInterval(pollInterval);
              const medsFromBackend = Array.isArray(match.medications) && match.medications.length > 0
                ? match.medications.map(m => `${m.medicine_name || ''} ${m.dosage || ''} (${m.frequency || ''})`.trim())
                : (match.extracted_medications || []);

              updateUploadedDocument(docId, {
                ocr_status: match.ocr_status,
                ocr_text: match.ocr_raw_text || (medsFromBackend.length > 0 ? 'Document scanned and verified.' : 'Could not extract clear information from this document. Please verify manually.'),
                extracted_medications: medsFromBackend
              });
              return;
            }
          }
        } catch (pollErr) {
          console.warn('Polling document error:', pollErr.message);
        }

        if (pollAttempts >= 4) {
          clearInterval(pollInterval);
        }
      }, 2500);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input
    e.target.value = '';
  };

  // Simulate quick kiosk document scan with a real canvas-drawn image for OCR
  const handleSimulateScan = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 320);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      if (selectedDocType === 'lab_report') {
        ctx.fillText('METROPOLIS CLINICAL LAB - BLOOD REPORT', 25, 45);
        ctx.font = '14px sans-serif';
        ctx.fillText('Patient: OPD Kiosk Demo', 25, 85);
        ctx.fillText('Hemoglobin: 13.8 g/dL (Normal: 13.0 - 17.0)', 25, 125);
        ctx.fillText('Fasting Blood Glucose: 98 mg/dL (Normal < 100)', 25, 165);
        ctx.fillText('Serum Cholesterol: 175 mg/dL (Normal < 200)', 25, 205);
        ctx.fillText('HbA1c: 5.6% (Normal < 5.7%)', 25, 245);
      } else if (selectedDocType === 'discharge_summary') {
        ctx.fillText('CITY CARE HOSPITAL - DISCHARGE SUMMARY', 25, 45);
        ctx.font = '14px sans-serif';
        ctx.fillText('Diagnosis: Acute Gastritis & Reflux', 25, 85);
        ctx.fillText('Condition on Discharge: Stable, Vitals normal (BP 120/80)', 25, 125);
        ctx.fillText('Rx: Tab Pantoprazole 40mg OD x 7 days', 25, 165);
        ctx.fillText('Rx: Syp Sucralfate 10ml TDS before food x 5 days', 25, 205);
      } else {
        ctx.fillText('AIIMS CLINICAL OPD PRESCRIPTION', 25, 45);
        ctx.font = '14px sans-serif';
        ctx.fillText('Diagnosis: Acute Bronchitis & Cough', 25, 85);
        ctx.fillText('Rx: Tab Amoxicillin 500mg TDS x 5 days', 25, 125);
        ctx.fillText('Rx: Syp Levosalbutamol 5ml TDS', 25, 165);
        ctx.fillText('Rx: Tab Montelukast 10mg HS x 10 days', 25, 205);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const simFile = new File([blob], `Kiosk_Scan_${selectedDocType}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleProcessFile(simFile);
        }
      }, 'image/jpeg');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-2 flex flex-col justify-center">

      {/* 1. SCREEN HEADER (WITH HIGH CONTRAST SOLID GLASS BACKDROP) */}
      <div className="mb-3 text-center">
        <div className={`inline-block px-6 py-3 rounded-2xl border-2 shadow-xl transition-all ${isLight
            ? 'bg-white border-teal-400 shadow-slate-500/20 text-slate-950'
            : 'bg-slate-900 border-teal-500 shadow-slate-950/70 text-white'
          }`}>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mb-1 border ${isLight
                ? 'bg-teal-100 border-teal-300 text-teal-950'
                : 'bg-teal-500/20 border-teal-500/40 text-teal-300'
              }`}
          >
            <ScanLine className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-pulse shrink-0" />
            <span>Step 5: Medical Records & Digitization</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
            Upload Prior Medical Records
          </h2>
        </div>
      </div>

      {/* 2. DOCUMENT TYPE SELECTOR CHIPS */}
      <div className="w-full mb-3">
        <div className="flex items-center justify-between text-[11px] font-black mb-1.5 px-1">
          <span className={`px-3 py-1 rounded-xl border-2 font-black shadow-md ${isLight
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-slate-900 border-teal-500/40 text-teal-300'
            }`}>
            Select Document Category (प्रकार चुनें):
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {docTypes.map((type) => {
            const IconComp = type.icon;
            const isSelected = selectedDocType === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedDocType(type.id)}
                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all text-left cursor-pointer transform active:scale-98 shadow-sm ${isSelected
                    ? isLight
                      ? 'bg-teal-50 border-teal-500 font-black text-teal-950 ring-2 ring-teal-500/30'
                      : 'bg-teal-500/20 border-teal-400 font-black text-white ring-2 ring-teal-400/30'
                    : isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-950 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${isSelected
                      ? isLight ? 'bg-teal-500 text-white border-teal-600' : 'bg-teal-400 text-slate-950 border-teal-300'
                      : isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className={`font-black text-xs sm:text-sm truncate ${isSelected ? (isLight ? 'text-teal-950' : 'text-white') : (isLight ? 'text-slate-950' : 'text-slate-100')}`}>
                    {type.label.split('/')[0]}
                  </div>
                  <div className={`text-[11px] font-bold truncate ${isSelected ? (isLight ? 'text-teal-800' : 'text-teal-200') : (isLight ? 'text-slate-600' : 'text-slate-300')}`}>
                    {type.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN UPLOAD / SCAN CARD */}
      <div className="w-full mb-3">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl p-4 sm:p-5 border-2 border-dashed backdrop-blur-md text-center transition-all cursor-pointer shadow-md relative overflow-hidden group ${isDragOver
              ? isLight
                ? 'bg-teal-50 border-teal-500'
                : 'bg-teal-950/40 border-teal-400'
              : isLight
                ? 'bg-white hover:bg-teal-50/70 border-slate-400 hover:border-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-900/85 hover:bg-slate-850 border-slate-700 hover:border-teal-500/60 text-white'
            }`}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">

            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs transition hover:scale-105 cursor-pointer ${isLight
                    ? 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
                  }`}
                title="Upload Document File (फ़ाइल अपलोड करें)"
              >
                <UploadCloud className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCamera();
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs transition hover:scale-105 cursor-pointer ${isLight
                    ? 'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                  }`}
                title="Open Camera Scanner (कैमरा खोलें)"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <h3 className={`text-base sm:text-lg font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Touch Here to Upload or Scan Document
            </h3>
            <p className="text-teal-600 dark:text-teal-400 font-black text-xs mt-0.5">
              फोटो खींचें या फाइल चुनें (PDF / JPG / PNG)
            </p>

            {/* Direct Action Pills inside Upload Card */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCamera();
                }}
                className={`px-3.5 py-2 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs ${isLight
                    ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-400 text-cyan-950'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-cyan-300'
                  }`}
              >
                <Camera className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Camera Snap</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateScan}
                className={`px-3.5 py-2 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs ${isLight
                    ? 'bg-teal-50 hover:bg-teal-100 border-teal-400 text-teal-950'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-teal-300'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Simulate 1-Tap Scan</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 4. UPLOADED DOCUMENTS LIST WITH OCR STATUS */}
      {uploadedDocs.length > 0 && (
        <div className="w-full mb-3">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Uploaded Documents ({uploadedDocs.length}):</span>
            </span>
          </div>

          <div className="space-y-2">
            {uploadedDocs.map((doc) => {
              const isProcessed = doc.ocr_status === 'processed';

              return (
                <div
                  key={doc.id || doc.document_id}
                  className={`rounded-xl p-3 border backdrop-blur-md shadow-xs flex items-center justify-between gap-3 ${isLight
                      ? 'bg-white border-slate-300 text-slate-950'
                      : 'bg-slate-900/90 border-slate-800 text-white'
                    }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 truncate">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 overflow-hidden ${isLight ? 'bg-teal-50 border-teal-200' : 'bg-slate-800 border-slate-700'
                        }`}
                    >
                      {doc.preview_url ? (
                        <img src={doc.preview_url} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-4 h-4 text-teal-500" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="font-bold text-xs truncate">
                        {doc.name}
                      </div>
                      <div className={`text-[10px] font-semibold truncate ${
                        doc.ocr_status === 'processed'
                          ? 'text-emerald-500'
                          : doc.ocr_status === 'failed'
                          ? 'text-amber-500'
                          : 'text-cyan-500'
                      }`}>
                        {doc.ocr_status === 'processed'
                          ? 'OCR Extracted ✓ Verified'
                          : doc.ocr_status === 'failed'
                          ? 'Needs Manual Verification'
                          : 'Scanning OCR...'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeUploadedDocument(doc.id || doc.document_id)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${isLight
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border-slate-700'
                      }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. NAVIGATION & SUBMISSION BAR */}
      <div className="w-full flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={prevStep}
          className={`h-12 px-5 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer ${isLight
              ? 'bg-white hover:bg-slate-100 text-slate-950 border-slate-400 shadow-md'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border-slate-700'
            }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Triage</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={nextStep}
            className={`h-12 px-5 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1 transition cursor-pointer ${isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
          >
            <span>Skip / No Docs</span>
          </button>

          <button
            type="button"
            onClick={nextStep}
            className="h-12 px-5 sm:px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition active:scale-98 cursor-pointer"
          >
            <span>Generate Token</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 6. LIVE CAMERA SCANNER MODAL (OPTION B) */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl shadow-cyan-950/50 flex flex-col space-y-4 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/40">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Document Camera Scanner • दस्तावेज़ कैमरा
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Align your {docTypes.find(d => d.id === selectedDocType)?.label.split('/')[0] || 'prescription'} inside the guide frame and snap
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Cancel & Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Viewfinder with targeting guide */}
            <div className="relative w-full aspect-4/3 sm:aspect-16/9 bg-black rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Document Targeting Grid / Overlay */}
              <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-cyan-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/70 px-2 py-0.5 rounded-md w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1.5 inline-block" />
                  <span>LIVE CAMERA FEED • {facingMode.toUpperCase()}</span>
                </div>
                <div className="text-center text-xs font-bold text-white bg-slate-950/80 px-3 py-1 rounded-full w-fit mx-auto shadow-md">
                  Hold document flat & steady • दस्तावेज़ को फ्रेम में रखें
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Cancel (रद्द करें)
              </button>

              <div className="flex items-center gap-2">
                {availableVideoDevices.length > 1 && (
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Switch Camera (कैमरा बदलें)"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Switch Camera</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Capture Photo (फोटो खींचें)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CAMERA ERROR / PERMISSION DENIED MODAL */}
      {cameraError && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-amber-950/50 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-white">
                Camera Access Needed • कैमरा अनुमति आवश्यक
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {cameraError}
              </p>
              <p className="text-[11px] text-slate-400">
                दस्तावेज़ स्कैन करने के लिए कैमरा अनुमति आवश्यक है। कृपया अनुमति दें या नीचे 'फ़ाइल चुनें' का उपयोग करें।
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  fileInputRef.current?.click();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
              >
                Touch Here to Upload (फ़ाइल चुनें)
              </button>

              <button
                type="button"
                onClick={() => setCameraError(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold hover:bg-slate-750 transition cursor-pointer"
              >
                Dismiss (बंद करें)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentUpload;
