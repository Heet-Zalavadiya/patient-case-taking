import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Minus,
  Maximize2, 
  Minimize2, 
  ChevronUp,
  Clock, 
  UserCheck, 
  HelpCircle, 
  AlertTriangle,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../../services/api';
import { usePatient } from '../../context/PatientContext';

const DISCLAIMER_TEXT = "This assistant gives general information only and is not a substitute for professional medical advice.";

const QUICK_PROMPTS = [
  { label: '🕒 OPD Timings', text: 'What are the hospital OPD timings?' },
  { label: '👨‍⚕️ Doctor Availability', text: 'Which doctors and departments are available today?' },
  { label: '📋 Consultation Help', text: 'What are the next steps in my consultation?' },
  { label: '💊 24x7 Pharmacy', text: 'Where is the 24x7 pharmacy located?' }
];

export const ChatbotWidget = ({ isLight = true }) => {
  const { patientData } = usePatient();

  // AUTHENTICATION GUARD:
  // Chatbot is strictly restricted to authenticated patients after Step 1 (Login/Registration)
  const isAuthenticated = Boolean(patientData?.patient_id && patientData?.current_step > 1);

  if (!isAuthenticated) {
    return null; // Completely hidden on the 1st page / unauthenticated state
  }

  const patientFirstName = patientData?.full_name ? patientData.full_name.split(' ')[0] : 'Patient';
  const welcomeMessage = `Hi ${patientFirstName}! I'm your MediKiosk assistant. You are authenticated (Token: ${patientData.token_number || 'OPD-Active'}). How can I assist you with your consultation today?`;

  const [isOpen, setIsOpen] = useState(false);
  // View mode states: 'normal' (340x460), 'minimized' (compact bottom bar), 'maximized' (540x680)
  const [viewMode, setViewMode] = useState('normal');
  const [inputMsg, setInputMsg] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: welcomeMessage }
  ]);
  const [history, setHistory] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen && viewMode !== 'minimized') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isWaiting, isOpen, viewMode]);

  // Focus input on open or restore
  useEffect(() => {
    if (isOpen && viewMode !== 'minimized') {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen, viewMode]);

  const handleSend = async (overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : inputMsg).trim();
    if (!text || isWaiting) return;

    setInputMsg('');

    // Add user message to UI
    const updatedMessages = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);

    // Context history for the API
    const priorHistory = [...history];
    setHistory([...priorHistory, { role: 'user', content: text }]);

    setIsWaiting(true);

    try {
      const chatEndpoint = `${BASE_URL}/api/chat`;
      const res = await axios.post(
        chatEndpoint,
        {
          message: text,
          history: priorHistory,
          patient_id: patientData.patient_id,
          patient_name: patientData.full_name
        },
        { timeout: 12000 }
      );

      const botReply = res.data?.reply || "Thank you for asking. Please check the kiosk screen for further details.";

      setMessages(prev => [...prev, { role: 'model', content: botReply }]);
      setHistory(prev => [...prev, { role: 'model', content: botReply }]);
    } catch (err) {
      console.warn('Chatbot API error:', err);

      let fallbackReply = "I am having temporary difficulty connecting to the assistant. " +
        "Hospital OPD is open Mon-Sat 8:00 AM - 4:00 PM. " +
        "Please proceed with your consultation on screen or visit Registration Counter 2.";

      if (err.response?.status === 429) {
        fallbackReply = "You are sending queries too quickly. Please wait a moment before trying again.";
      }

      setMessages(prev => [...prev, { role: 'model', content: fallbackReply }]);
      setHistory(prev => [...prev, { role: 'model', content: fallbackReply }]);
    } finally {
      setIsWaiting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([{ role: 'model', content: welcomeMessage }]);
    setHistory([]);
  };

  // Toggle maximize / restore
  const handleToggleMaximize = (e) => {
    e?.stopPropagation();
    if (viewMode === 'maximized') {
      setViewMode('normal');
    } else {
      setViewMode('maximized');
    }
  };

  // Toggle minimize / restore
  const handleToggleMinimize = (e) => {
    e?.stopPropagation();
    if (viewMode === 'minimized') {
      setViewMode('normal');
    } else {
      setViewMode('minimized');
    }
  };

  // Compute container dimensions based on viewMode
  const getSizeClasses = () => {
    switch (viewMode) {
      case 'minimized':
        return 'w-[300px] sm:w-[340px] h-[48px] rounded-t-2xl rounded-b-md shadow-lg';
      case 'maximized':
        return 'w-[560px] max-w-[calc(100vw-24px)] h-[680px] max-h-[calc(100vh-50px)] rounded-2xl shadow-2xl';
      case 'normal':
      default:
        return 'w-[340px] max-w-[calc(100vw-32px)] h-[460px] max-h-[calc(100vh-100px)] rounded-2xl shadow-2xl';
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Visible when chat window is closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setViewMode('normal');
          }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border-2 ${
            isLight
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400 shadow-blue-500/30'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 shadow-emerald-500/40'
          }`}
          title={`Ask MediKiosk Assistant (${patientData.full_name})`}
          aria-label="Open MediKiosk Assistant Chatbot"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-xs font-black tracking-wide uppercase flex items-center gap-1">
              <span>MediKiosk AI</span>
              <ShieldCheck className="w-3 h-3 text-emerald-300 inline" />
            </div>
            <div className="text-[10px] opacity-90">{patientFirstName} • Verified</div>
          </div>
        </button>
      )}

      {/* CHAT WINDOW (Supports Minimized, Normal, and Maximized modes) */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 ${getSizeClasses()} flex flex-col overflow-hidden border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            isLight
              ? 'bg-white/95 border-blue-200 text-slate-800 shadow-blue-900/20 backdrop-blur-md'
              : 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-black/60 backdrop-blur-md'
          }`}
        >
          {/* HEADER (Clicking restores if minimized) */}
          <div
            onClick={() => {
              if (viewMode === 'minimized') setViewMode('normal');
            }}
            className={`px-3.5 py-2.5 flex items-center justify-between select-none ${
              viewMode === 'minimized' ? 'cursor-pointer hover:brightness-105' : ''
            } ${
              isLight
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                : 'bg-gradient-to-r from-emerald-800 to-teal-900 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight leading-tight flex items-center gap-1.5">
                  <span>MediKiosk Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {viewMode === 'maximized' && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase">Expanded</span>
                  )}
                  {viewMode === 'minimized' && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase">Click to expand</span>
                  )}
                </div>
                <div className="text-[10px] opacity-90 font-medium">
                  {patientData.full_name} • Token #{patientData.token_number || 'Active'}
                </div>
              </div>
            </div>

            {/* HEADER CONTROLS */}
            <div className="flex items-center gap-1">
              {/* RESTORE / EXPAND BUTTON WHEN MINIMIZED */}
              {viewMode === 'minimized' && (
                <button
                  type="button"
                  onClick={handleToggleMinimize}
                  className="p-1 rounded-lg hover:bg-white/20 transition cursor-pointer text-white/90 hover:text-white"
                  title="Expand / Restore Chat"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}

              {/* CONTROLS WHEN EXPANDED (NORMAL OR MAXIMIZED) */}
              {viewMode !== 'minimized' && (
                <>
                  {/* Reset conversation */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetChat();
                    }}
                    className="p-1 rounded-lg hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
                    title="Restart Chat"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Minimize button */}
                  <button
                    type="button"
                    onClick={handleToggleMinimize}
                    className="p-1 rounded-lg hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
                    title="Minimize Chat Window"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Maximize / Restore button */}
                  <button
                    type="button"
                    onClick={handleToggleMaximize}
                    className="p-1 rounded-lg hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
                    title={viewMode === 'maximized' ? 'Restore Window' : 'Maximize Window'}
                  >
                    {viewMode === 'maximized' ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}

              {/* Close button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* EXPANDED CONTENT (Only shown when not minimized) */}
          {viewMode !== 'minimized' && (
            <>
              {/* QUICK PROMPT SUGGESTIONS */}
              <div
                className={`p-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none text-[11px] ${
                  isLight ? 'bg-blue-50/70 border-blue-100' : 'bg-slate-800/60 border-slate-700'
                }`}
              >
                {QUICK_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q.text)}
                    disabled={isWaiting}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-full font-semibold transition active:scale-95 cursor-pointer border ${
                      isLight
                        ? 'bg-white hover:bg-blue-100 text-blue-700 border-blue-200 shadow-xs'
                        : 'bg-slate-700/80 hover:bg-slate-600 text-emerald-300 border-slate-600 shadow-xs'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* MESSAGES SCROLL AREA */}
              <div
                className={`flex-1 p-3 overflow-y-auto space-y-2.5 text-xs ${
                  isLight ? 'bg-slate-50/60' : 'bg-slate-950/40'
                }`}
              >
                {messages.map((m, index) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed whitespace-pre-line shadow-xs ${
                          isUser
                            ? isLight
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-emerald-600 text-white rounded-br-xs'
                            : isLight
                              ? 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                              : 'bg-slate-800/90 text-slate-100 border border-slate-700 rounded-bl-xs'
                        } ${viewMode === 'maximized' ? 'text-sm px-4 py-2.5' : ''}`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}

                {/* TYPING INDICATOR */}
                {isWaiting && (
                  <div className="flex justify-start">
                    <div
                      className={`rounded-2xl rounded-bl-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs ${
                        isLight ? 'bg-white border border-slate-200 text-slate-500' : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-[10px] ml-1 font-medium">Assistant thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT BAR */}
              <div
                className={`p-2.5 border-t flex items-center gap-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isWaiting}
                  placeholder="Ask about timings, doctors, or help..."
                  className={`flex-1 px-3 py-2 rounded-xl outline-none transition border ${
                    viewMode === 'maximized' ? 'text-sm' : 'text-xs'
                  } ${
                    isLight
                      ? 'bg-slate-100 focus:bg-white focus:border-blue-500 text-slate-800 border-slate-200'
                      : 'bg-slate-800 focus:bg-slate-700 focus:border-emerald-400 text-slate-100 border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputMsg.trim() || isWaiting}
                  className={`p-2 rounded-xl transition transform active:scale-90 flex items-center justify-center cursor-pointer ${
                    !inputMsg.trim() || isWaiting
                      ? 'opacity-40 cursor-not-allowed bg-slate-300 text-slate-500'
                      : isLight
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* DISCLAIMER FOOTER */}
              <div
                className={`px-3 py-1.5 text-[9.5px] leading-tight text-center border-t select-none ${
                  isLight
                    ? 'bg-slate-50 text-slate-500 border-slate-100'
                    : 'bg-slate-950 text-slate-400 border-slate-900'
                }`}
              >
                {DISCLAIMER_TEXT}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
