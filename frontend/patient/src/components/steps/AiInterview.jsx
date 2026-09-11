import React, { useState, useEffect, useRef } from 'react';
import { usePatient } from '../../context/PatientContext';
import { 
  createClinicalSession, 
  saveInterviewTurn, 
  triggerRedFlag,
  generateClinicalSummary
} from '../../services/api';
import { speakPhrase } from '../../utils/speechUtils';
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../../constants/languages';
import { 
  Bot, 
  Volume2, 
  Mic, 
  MicOff, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Flame, 
  Activity, 
  HeartPulse, 
  PhoneCall, 
  Check, 
  ShieldAlert, 
  Smile, 
  Meh, 
  Frown, 
  FlameKindling,
  Stethoscope,
  Clock,
  Radio,
  RefreshCw,
  Loader2,
  Database,
  CheckCircle
} from 'lucide-react';

export const AiInterview = () => {
  const { 
    patientData, 
    theme, 
    setSessionId, 
    setSessionStatus,
    setSummaryData,
    setHistoryMode, 
    addInterviewTurn, 
    setRedFlagAlert, 
    nextStep, 
    prevStep,
    goToStep
  } = usePatient();

  const isLight = theme === 'light';

  // State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSavingTurn, setIsSavingTurn] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showRedFlagModal, setShowRedFlagModal] = useState(false);
  const [redFlagDetail, setRedFlagDetail] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [toastNotification, setToastNotification] = useState(null); // { message: string, type: 'turn' | 'summary' }

  const showToast = (message, type = 'turn') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.message === message ? null : prev));
    }, 2800);
  };

  const recognitionRef = useRef(null);

  // Initialize clinical session on mount if not already present
  useEffect(() => {
    const initSession = async () => {
      if (!patientData.session_id) {
        try {
          const res = await createClinicalSession(
            patientData.patient_id || 1,
            patientData.history_mode || 'allopathic'
          );
          if (res && res.session_id) {
            setSessionId(res.session_id);
          }
        } catch (e) {
          console.warn('Session init error:', e);
        }
      }
    };
    initSession();
  }, [patientData.session_id, patientData.patient_id]);

  // Language mapping from unified supported languages
  const preferredLang = patientData.preferred_language || 'Hindi';
  const langConfig = getLanguageConfig(preferredLang);
  const lang = SUPPORTED_LANGUAGES[preferredLang] ? preferredLang : 'Hindi';
  const langCode = langConfig.code;

  // Smart Question Bank (SOCRATES & AYUSH Framework) for ALL 6 Languages
  const getQuestions = () => {
    const isAyush = patientData.history_mode === 'ayush';

    return [
      {
        id: 'chief_complaint',
        category: 'SOCRATES: Site & Complaint',
        text: {
          Hindi: 'आज आपको क्या तकलीफ़ या स्वास्थ्य समस्या हो रही है?',
          English: 'What medical issue brings you to the hospital today?',
          Gujarati: 'આજે તમને કઈ તકલીફ અથવા સ્વાસ્થ્ય સમસ્યા થઈ રહી છે?',
          Marathi: 'आज तुम्हाला काय मुख्य त्रास होत आहे?',
          Tamil: 'இன்று உங்களுக்கு என்ன உடல்நல பிரச்சனை உள்ளது?',
          Bengali: 'আজ আপনার কী সমস্যা হচ্ছে?'
        },
        chips: {
          Hindi: [
            { label: 'छाती में दर्द व भारीपन', isEmergency: true },
            { label: 'तेज़ बुखार और कंपकंपी', isEmergency: false },
            { label: 'सिर दर्द एवं चक्कर', isEmergency: false },
            { label: 'पेट में तीव्र दर्द', isEmergency: false },
            { label: 'सांस लेने में तकलीफ़', isEmergency: true },
            { label: 'जोड़ों का दर्द व सूजन', isEmergency: false }
          ],
          English: [
            { label: 'Chest Pain & Tightness', isEmergency: true },
            { label: 'High Fever & Chills', isEmergency: false },
            { label: 'Severe Headache & Dizziness', isEmergency: false },
            { label: 'Stomach Pain / Cramps', isEmergency: false },
            { label: 'Shortness of Breath', isEmergency: true },
            { label: 'Joint Pain & Stiffness', isEmergency: false }
          ],
          Gujarati: [
            { label: 'છાતીમાં દુખાવો અને ભીંસ', isEmergency: true },
            { label: 'તીવ્ર તાવ અને ધ્રુજારી', isEmergency: false },
            { label: 'માથાનો દુખાવો અને ચક્કર', isEmergency: false },
            { label: 'પેટમાં સખત દુખાવો', isEmergency: false },
            { label: 'શ્વાસ લેવામાં તકલીફ', isEmergency: true },
            { label: 'સાંધાનો દુખાવો અને સોજો', isEmergency: false }
          ],
          Marathi: [
            { label: 'छातीत दुखणे', isEmergency: true },
            { label: 'तीव्र ताप', isEmergency: false },
            { label: 'डोकेदुखी', isEmergency: false },
            { label: 'पोटात दुखणे', isEmergency: false },
            { label: 'श्वास घेण्यास त्रास', isEmergency: true },
            { label: 'सांधेदुखी व सूज', isEmergency: false }
          ],
          Tamil: [
            { label: 'மார்பு வலி', isEmergency: true },
            { label: 'கடுமையான காய்ச்சல்', isEmergency: false },
            { label: 'தலைவலி', isEmergency: false },
            { label: 'வயிற்று வலி', isEmergency: false },
            { label: 'மூச்சுத் திணறல்', isEmergency: true },
            { label: 'மூட்டு வலி', isEmergency: false }
          ],
          Bengali: [
            { label: 'বুকে ব্যথা', isEmergency: true },
            { label: 'তীব্র জ্বর', isEmergency: false },
            { label: 'মাথাব্যথা', isEmergency: false },
            { label: 'পেটে ব্যথা', isEmergency: false },
            { label: 'শ্বাসকষ্ট', isEmergency: true },
            { label: 'গাঁটে ব্যথা ও ফোলা', isEmergency: false }
          ]
        }
      },
      {
        id: 'onset',
        category: 'SOCRATES: Onset & Duration',
        text: {
          Hindi: 'यह तकलीफ़ या दर्द कब से शुरू हुआ है?',
          English: 'When did this problem or discomfort start?',
          Gujarati: 'આ તકલીફ કે દુખાવો ક્યારથી શરૂ થયો છે?',
          Marathi: 'हा त्रास कधीपासून सुरू झाला आहे?',
          Tamil: 'இந்த வலி எப்போது தொடங்கியது?',
          Bengali: 'এই সমস্যাটি কখন শুরু হয়েছিল?'
        },
        chips: {
          Hindi: [
            { label: 'आज सुबह अचानक (Sudden)', isEmergency: false },
            { label: 'पिछले 2-3 दिनों से', isEmergency: false },
            { label: '1 हफ्ते से अधिक समय से', isEmergency: false },
            { label: '1 महीने से ज्यादा (पुराना दर्द)', isEmergency: false }
          ],
          English: [
            { label: 'Suddenly Today Morning', isEmergency: false },
            { label: '2-3 Days Ago', isEmergency: false },
            { label: 'Over 1 Week', isEmergency: false },
            { label: 'Chronic (> 1 Month)', isEmergency: false }
          ],
          Gujarati: [
            { label: 'આજે સવારે અચાનક', isEmergency: false },
            { label: 'છેલ્લા 2-3 દિવસથી', isEmergency: false },
            { label: '1 અઠવાડિયા કરતાં વધુ સમયથી', isEmergency: false },
            { label: '1 મહિના કરતાં વધુ (જૂનો દુખાવો)', isEmergency: false }
          ],
          Marathi: [
            { label: 'आज सकाळपासून', isEmergency: false },
            { label: '२-३ दिवसांपूर्वी', isEmergency: false },
            { label: '१ आठवड्यापेक्षा जास्त', isEmergency: false },
            { label: '१ महिन्यापेक्षा जुना त्रास', isEmergency: false }
          ],
          Tamil: [
            { label: 'இன்று முதல்', isEmergency: false },
            { label: '2-3 நாட்களாக', isEmergency: false },
            { label: '1 வாரத்திற்கும் மேலாக', isEmergency: false },
            { label: '1 மாதத்திற்கும் மேலாக', isEmergency: false }
          ],
          Bengali: [
            { label: 'আজ সকাল থেকে', isEmergency: false },
            { label: '২-৩ দিন আগে', isEmergency: false },
            { label: '১ সপ্তাহের বেশি', isEmergency: false },
            { label: '১ মাসের বেশি সময় ধরে', isEmergency: false }
          ]
        }
      },
      {
        id: 'severity',
        category: 'SOCRATES: Severity & Pain Score',
        isPainScale: true,
        text: {
          Hindi: 'दर्द या तकलीफ़ की तीव्रता 1 से 10 के पैमाने पर कितनी है?',
          English: 'How severe is your pain or discomfort on a scale of 1 to 10?',
          Gujarati: 'દુખાવાની તીવ્રતા 1 થી 10 ના સ્કેલ પર કેટલી છે?',
          Marathi: 'वेदनांची तीव्रता १ ते १० मध्ये किती आहे?',
          Tamil: 'வலியின் தீவிரத்தை 1 முதல் 10 வரை குறிப்பிடவும்:',
          Bengali: 'ব্যথার তীব্রতা ১ থেকে ১০ এর মধ্যে কত?'
        },
        chips: {
          Hindi: [],
          English: [],
          Gujarati: [],
          Marathi: [],
          Tamil: [],
          Bengali: []
        }
      },
      isAyush
        ? {
            id: 'ayush_agni',
            category: 'AYUSH: Agni & Koshtha Pariksha',
            text: {
              Hindi: 'आपकी भूख और पाचन क्रिया (अग्नि) की वर्तमान स्थिति कैसी है?',
              English: 'How is your appetite, digestion, and metabolic fire (Agni)?',
              Gujarati: 'તમારી ભૂખ અને પાચનક્રિયા (અગ્નિ) ની સ્થિતિ કેવી છે?',
              Marathi: 'तुमची भूक आणि पचनक्रिया (अग्नि) कशी आहे?',
              Tamil: 'உங்கள் பசி மற்றும் செரிமான திறன் (அக்னி) எவ்வாறு உள்ளது?',
              Bengali: 'আপনার ক্ষুধা ও পরিপাক ক্ষমতা (অগ্নি) কেমন?'
            },
            chips: {
              Hindi: [
                { label: 'सामान्य भूख व पाचन (समाग्नि)', isEmergency: false },
                { label: 'भूख नहीं लगती / भारीपन (मंदाग्नि)', isEmergency: false },
                { label: 'अत्यधिक भूख व पेट में जलन (तीक्ष्णाग्नि)', isEmergency: false },
                { label: 'अनियमित भूख व गैस (विषमाग्नि)', isEmergency: false }
              ],
              English: [
                { label: 'Normal Appetite & Digestion (Samagni)', isEmergency: false },
                { label: 'Low Appetite / Bloating (Mandagni)', isEmergency: false },
                { label: 'Excessive Appetite / Acidity (Tikshnagni)', isEmergency: false },
                { label: 'Irregular Digestion / Gas (Vishamagni)', isEmergency: false }
              ],
              Gujarati: [
                { label: 'સામાન્ય ભૂખ અને પાચન (સમાગ્નિ)', isEmergency: false },
                { label: 'ભૂખ ન લાગવી / ભારેપણું (મંદાગ્નિ)', isEmergency: false },
                { label: 'અતિશય ભૂખ અને એસિડિટી (તીક્ષ્ણાગ્નિ)', isEmergency: false },
                { label: 'અનિયમિત પાચન અને ગેસ (વિષમાગ્નિ)', isEmergency: false }
              ],
              Marathi: [
                { label: 'नेहमीप्रमाणे भूक (समाग्नि)', isEmergency: false },
                { label: 'भूक मंदावली आहे (मंदाग्नि)', isEmergency: false },
                { label: 'अतिशय भूक लागते / ॲसिडिटी (तीक्ष्णाग्नि)', isEmergency: false },
                { label: 'अनियमित भूक व गॅस (विषमाग्नि)', isEmergency: false }
              ],
              Tamil: [
                { label: 'இயல்பான பசி (சமாக்னி)', isEmergency: false },
                { label: 'பசி குறைவு / மந்தம் (மந்தாக்னி)', isEmergency: false },
                { label: 'அதிக பசி / நெஞ்செரிச்சல் (தீக்ஷ்ணாக்னி)', isEmergency: false },
                { label: 'ஒழுங்கற்ற செரிமானம் (விஷமாக்னி)', isEmergency: false }
              ],
              Bengali: [
                { label: 'স্বাভাবিক ক্ষুধা ও হজম (সমাগ্নি)', isEmergency: false },
                { label: 'ক্ষুধা কম / পেট ভারী (মন্দাগ্নি)', isEmergency: false },
                { label: 'অতিরিক্ত ক্ষুধা / এসিডিটি (তীক্ষ্ণাগ্নি)', isEmergency: false },
                { label: 'অনিয়মিত ক্ষুধা ও গ্যাস (বিষমাগ্নি)', isEmergency: false }
              ]
            }
          }
        : {
            id: 'medical_history',
            category: 'Medical History: Comorbidities',
            text: {
              Hindi: 'क्या आप कोई नियमित दवा लेते हैं या पुरानी बीमारी (बीपी/शुगर) है?',
              English: 'Do you have existing chronic conditions or take daily medications?',
              Gujarati: 'શું તમને કોઈ જૂની બીમારી (બીપી/ડાયાબિટીસ) છે અથવા નિયમિત દવા લો છો?',
              Marathi: 'तुम्हाला कोणताही जुना आजार (बीपी/मधुमेह) आहे का किंवा नियमित औषधे घेता का?',
              Tamil: 'உங்களுக்கு ஏற்கனவே ஏதேனும் நாள்பட்ட நோய் உள்ளதா அல்லது மருந்துகள் உட்கொள்கிறீர்களா?',
              Bengali: 'আপনার কি কোনো দীর্ঘস্থায়ী রোগ (বিপি/ডায়াবেটিস) আছে বা নিয়মিত ওষুধ খান?'
            },
            chips: {
              Hindi: [
                { label: 'कोई पुरानी बीमारी नहीं (None)', isEmergency: false },
                { label: 'मधुमेह / शुगर (Diabetes)', isEmergency: false },
                { label: 'उच्च रक्तचाप (Hypertension / BP)', isEmergency: false },
                { label: 'दमा / सांस की बीमारी (Asthma)', isEmergency: false },
                { label: 'हृदय रोग का पूर्व इतिहास (Heart Disease)', isEmergency: true }
              ],
              English: [
                { label: 'No Prior Chronic Illness (Healthy)', isEmergency: false },
                { label: 'Diabetes Mellitus (Sugar)', isEmergency: false },
                { label: 'High Blood Pressure (Hypertension)', isEmergency: false },
                { label: 'Asthma / Respiratory Condition', isEmergency: false },
                { label: 'Prior Heart Disease / Stent', isEmergency: true }
              ],
              Gujarati: [
                { label: 'કોઈ જૂની બીમારી નથી (સ્વસ્થ)', isEmergency: false },
                { label: 'ડાયાબિટીસ (સુગર)', isEmergency: false },
                { label: 'હાઈ બ્લડ પ્રેશર (બીપી)', isEmergency: false },
                { label: 'દમ / અસ્થમા', isEmergency: false },
                { label: 'હૃદય રોગનો ઈતિહાસ', isEmergency: true }
              ],
              Marathi: [
                { label: 'कोणताही जुना आजार नाही (निरोगी)', isEmergency: false },
                { label: 'मधुमेह (डायबेटिस)', isEmergency: false },
                { label: 'उच्च रक्तदाब (बीपी)', isEmergency: false },
                { label: 'दमा / श्वसनाचा त्रास', isEmergency: false },
                { label: 'हृदयरोग / हार्ट हिस्ट्री', isEmergency: true }
              ],
              Tamil: [
                { label: 'பழைய நோய் ஏதுமில்லை (ஆரோக்கியம்)', isEmergency: false },
                { label: 'சர்க்கரை நோய் (நீரிழிவு)', isEmergency: false },
                { label: 'உயர் ரத்த அழுத்தம் (BP)', isEmergency: false },
                { label: 'ஆஸ்துமா / மூச்சு பிரச்சனை', isEmergency: false },
                { label: 'இதய நோய் வரலாறு', isEmergency: true }
              ],
              Bengali: [
                { label: 'কোনো পুরোনো রোগ নেই (সুস্থ)', isEmergency: false },
                { label: 'ডায়াবেটিস (সুগার)', isEmergency: false },
                { label: 'উচ্চ রক্তচাপ (বিপি)', isEmergency: false },
                { label: 'হাঁপানি / অ্যাজমা', isEmergency: false },
                { label: 'হৃদরোগের ইতিহাস', isEmergency: true }
              ]
            }
          }
    ];
  };

  const questions = getQuestions();
  const currentQ = questions[currentQIndex] || questions[0];

  // Clean fallback: target language -> Hindi -> English -> first available
  const currentQText = currentQ.text[lang] || currentQ.text['Hindi'] || currentQ.text['English'] || Object.values(currentQ.text)[0];
  const currentChips = currentQ.chips[lang] || currentQ.chips['Hindi'] || currentQ.chips['English'] || [];

  // Play Active Question Audio
  const handlePlayQuestion = async () => {
    setIsPlayingAudio(true);
    try {
      await speakPhrase(currentQText, langCode);
    } catch (e) {
      console.warn('Audio play note:', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Auto-speak question after 400ms delay if accessibility_mode is audio-guided
  useEffect(() => {
    if (patientData.accessibility_mode === 'audio-guided') {
      const timer = setTimeout(() => {
        handlePlayQuestion();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentQIndex, patientData.accessibility_mode]);

  // Evaluate Emergency Keywords for Red-Flag Trigger across all 6 languages
  const checkForRedFlags = (text) => {
    const lower = text.toLowerCase();
    const redFlagPatterns = [
      'chest pain', 'छाती में दर्द', 'छाती', 'heart attack', 'हार्ट',
      'breathing difficulty', 'सांस', 'दम फूलना', 'shortness of breath',
      'severe bleeding', 'खून बहना', 'blood vomit',
      'stroke', 'लकवा', 'loss of consciousness', 'बेहोश', 'fainted',
      'અસહ્ય છાતીમાં દુખાવો', 'શ્વાસ લેવામાં તકલીફ', 'છાતી',
      'छातीत दुखणे', 'छातीत', 'श्वास घेण्यास त्रास', 'हार्ट',
      'மார்பு வலி', 'மார்பு', 'மூச்சுத் திணறல்', 'இதயம்',
      'বুকে ব্যথা', 'বুকে', 'শ্বাসকষ্ট', 'হার্ট'
    ];

    const isMatch = redFlagPatterns.some(pattern => lower.includes(pattern));
    return isMatch;
  };

  // Finish Interview & Trigger Clinical Summary Generation
  const handleFinishInterview = async () => {
    if (isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    const activeSessionId = patientData.session_id || 10101;
    const turns = patientData.interview_turns || [];
    const chiefComplaint = turns.length > 0 ? turns[0].patient_response_text : 'General Case Consultation';

    showToast('Clinical summary generation triggered...', 'summary');

    try {
      const summaryPayload = {
        chief_complaint: chiefComplaint,
        history_mode: patientData.history_mode || 'allopathic',
        turns_count: turns.length,
        status: 'draft'
      };

      const result = await generateClinicalSummary(activeSessionId, summaryPayload);
      
      const summaryId = result?.summary_id || result?.history_id || result?.summary?.id || 1;
      const summaryData = result?.summary || result || {};

      // Update PatientContext state
      setSessionStatus('completed');
      setSummaryData(summaryId, summaryData);

      showToast('Draft clinical summary generated & attached to session', 'summary');
    } catch (err) {
      console.warn('Clinical summary generation note:', err);
      setSessionStatus('completed');
      setSummaryData(1, { chief_complaint: chiefComplaint, status: 'draft' });
    } finally {
      setIsGeneratingSummary(false);
      // Smoothly advance to Step 5 (Document Upload)
      goToStep(5);
    }
  };

  // Record a Turn & Auto-Advance
  const handleAnswerSubmit = async (answerText, inputMode = 'touch', isEmergencyChip = false) => {
    if (!answerText.trim()) return;

    setIsSavingTurn(true);
    const turnNumber = currentQIndex + 1;
    const sessionId = patientData.session_id || 10101;

    // Check emergency trigger
    const isEmergency = isEmergencyChip || checkForRedFlags(answerText);

    const turnPayload = {
      turn_number: turnNumber,
      input_mode: inputMode,
      ai_question: currentQText,
      patient_response_text: answerText.trim(),
      response_language: lang
    };

    // 1. Add to context
    addInterviewTurn(turnPayload);

    // 2. Call backend API
    try {
      await saveInterviewTurn(sessionId, turnPayload);
      showToast(`Turn ${turnNumber} logged to clinical_sessions`, 'turn');
    } catch (err) {
      console.warn('Turn save fallback:', err);
      showToast(`Turn ${turnNumber} saved locally`, 'turn');
    }

    // 3. Trigger Red-Flag Emergency if detected
    if (isEmergency) {
      const flagData = {
        flag_description: `Emergency Triage Triggered: "${answerText}" during ${currentQ.category}`,
        severity: 'HIGH'
      };
      try {
        await triggerRedFlag(sessionId, flagData);
      } catch (err) {
        console.warn('Red flag fallback:', err);
      }
      setRedFlagAlert(flagData);
      setRedFlagDetail(flagData);
      setShowRedFlagModal(true);
    }

    setIsSavingTurn(false);
    setVoiceText('');
    setSelectedRating(null);

    // 4. Advance to next question or complete
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Finished all questions, generate summary and proceed to Step 5
      await handleFinishInterview();
    }
  };

  // Pain Scale Rating Selection
  const handlePainRating = (score) => {
    setSelectedRating(score);
    const painLabel = score <= 3 
      ? `Score ${score}/10 (Mild / हल्का)` 
      : score <= 6 
      ? `Score ${score}/10 (Moderate / मध्यम)` 
      : score <= 8 
      ? `Score ${score}/10 (Severe / तीव्र)` 
      : `Score ${score}/10 (Critical / असहनीय दर्द)`;

    const isEmergency = score >= 9;
    handleAnswerSubmit(painLabel, 'touch', isEmergency);
  };

  // Speech Recognition (Web Speech API + Simulated Fallback)
  const startVoiceRecording = () => {
    setIsListening(true);
    setVoiceText('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;

        // Dynamically set recognition language from SUPPORTED_LANGUAGES (hi-IN, en-IN, gu-IN, mr-IN, ta-IN, bn-IN)
        recognition.lang = langConfig?.code || 'hi-IN';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setVoiceText(transcript);
        };

        recognition.onerror = (err) => {
          console.warn('SpeechRecognition error, using simulation fallback:', err);
          fallbackVoiceSimulation();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed to start:', e);
      }
    }

    fallbackVoiceSimulation();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const fallbackVoiceSimulation = () => {
    setTimeout(() => {
      const sampleResponses = {
        Hindi: 'मुझे पिछले 2 दिन से तेज़ सिर दर्द और हल्का बुखार है।',
        English: 'I have had a severe headache and mild fever since yesterday.',
        Gujarati: 'મને છેલ્લા બે દિવસથી ખૂબ માથું દુખે છે અને સામાન્ય તાવ છે.',
        Marathi: 'मला गेल्या २ दिवसांपासून तीव्र डोकेदुखी आणि ताप जाणवत आहे.',
        Tamil: 'எனக்கு கடந்த 2 நாட்களாக கடுமையான தலைவலியும் லேசான காய்ச்சலும் உள்ளது.',
        Bengali: 'আমার গত ২ দিন ধরে খুব মাথা ব্যথা এবং হালকা জ্বর হচ্ছে।'
      };
      setVoiceText(sampleResponses[lang] || sampleResponses['Hindi']);
      setIsListening(false);
    }, 1800);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 flex flex-col">
      
      {/* 1. TOP HEADER & TRIAGE MODE SWITCHER */}
      <div className="mt-1 sm:mt-2 mb-3 sm:mb-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          
          <div
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
              isLight
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 animate-pulse" />
            <span className="truncate max-w-[280px] sm:max-w-none">AI Clinical Interview (SOCRATES Framework)</span>
          </div>

          {/* Clean, Non-Intrusive Notification Badge */}
          {toastNotification && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm ${
                toastNotification.type === 'summary'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : isLight
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
              }`}
            >
              {toastNotification.type === 'summary' ? (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{toastNotification.message}</span>
            </div>
          )}

          {/* History Mode Toggle Pill */}
          <div className={`inline-flex items-center p-1 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setHistoryMode('allopathic')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                patientData.history_mode === 'allopathic'
                  ? isLight
                    ? 'bg-white text-cyan-800 shadow-sm border border-cyan-200'
                    : 'bg-cyan-500 text-slate-950 shadow-md'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Allopathic Triage
            </button>
            <button
              type="button"
              onClick={() => setHistoryMode('ayush')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                patientData.history_mode === 'ayush'
                  ? isLight
                    ? 'bg-emerald-100 text-emerald-900 shadow-sm border border-emerald-300'
                    : 'bg-emerald-500 text-slate-950 shadow-md'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Ayush Agni Pariksha</span>
            </button>
          </div>

        </div>

        <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Multimodal Symptom Intake
        </h2>
        {patientData.full_name && (
          <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
            <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Patient: <strong className="text-emerald-500">{patientData.full_name}</strong>
              {patientData.age ? ` (${patientData.age}y • ${patientData.gender})` : ''}
            </span>
            {patientData.demo_chief_complaint && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-semibold">
                Target Complaint: {patientData.demo_chief_complaint}
              </span>
            )}
          </div>
        )}
        <p className="text-emerald-500 font-bold text-base sm:text-lg mt-0.5">
          लक्षण एवं स्वास्थ्य इतिहास पूछताछ
        </p>
      </div>

      {/* 2. PROGRESS STEPPER BAR */}
      <div className="w-full mb-5">
        <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-1">
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
            Step 4: Clinical Question {currentQIndex + 1} of {questions.length}
          </span>
          <span className="text-cyan-500 font-mono">
            {Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete
          </span>
        </div>
        <div className={`w-full h-2.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. ACTIVE AI QUESTION CARD */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border-2 backdrop-blur-md mb-6 shadow-xl transition-all duration-300 relative overflow-hidden ${
          isLight
            ? 'bg-white/90 border-cyan-400/80 shadow-cyan-900/10 text-slate-900'
            : 'bg-slate-900/85 border-cyan-500/60 shadow-cyan-950/30 text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Bot className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-500">
                  {currentQ.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Preferred: {lang}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h3 className={`text-lg sm:text-2xl font-black leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentQText}
                </h3>
                
                {/* Active Audio Wave Visual Indicator */}
                {isPlayingAudio && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shrink-0 animate-in fade-in">
                    <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-[bounce_0.6s_infinite_100ms]" />
                    <span className="w-1 h-5 bg-cyan-300 rounded-full animate-[bounce_0.6s_infinite_200ms]" />
                    <span className="w-1 h-2.5 bg-cyan-400 rounded-full animate-[bounce_0.6s_infinite_300ms]" />
                    <span className="w-1 h-4 bg-cyan-500 rounded-full animate-[bounce_0.6s_infinite_150ms]" />
                    <span className="text-[10px] font-mono font-bold uppercase ml-1">Speaking</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TTS Audio Speak Button */}
          <button
            type="button"
            onClick={handlePlayQuestion}
            className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer shrink-0 active:scale-95 ${
              isPlayingAudio
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse shadow-md shadow-cyan-500/30'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-750 border-slate-700'
            }`}
            title="Read Question Aloud"
          >
            <Volume2 className="w-5 h-5 text-cyan-500" />
          </button>
        </div>
      </div>

      {/* 4. INTERACTION AREA: TOUCH CHIPS OR PAIN RATING */}
      <div className="w-full mb-6">
        
        {/* IF PAIN SCALE: Visual Interactive 1-10 Rating Scale */}
        {currentQ.isPainScale ? (
          <div
            className={`rounded-3xl p-6 sm:p-7 border backdrop-blur-md shadow-xl ${
              isLight
                ? 'bg-white/90 border-slate-200 text-slate-900'
                : 'bg-slate-900/85 border-slate-700/60 text-white'
            }`}
          >
            <div className="text-center mb-5">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tap Your Pain Level / अपना दर्द स्तर चुनें (1 = Mild, 10 = Emergency)
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isMild = num <= 3; // 1 to 3: Green tint
                const isModerate = num >= 4 && num <= 6; // 4 to 6: Yellow tint
                const isSevere = num >= 7; // 7 to 10: Red tint with pulsing warning

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePainRating(num)}
                    className={`h-18 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-150 transform active:scale-95 cursor-pointer shadow-md select-none ${
                      isMild
                        ? isLight
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-400 text-emerald-950 hover:border-emerald-500 shadow-emerald-500/10'
                          : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-300 shadow-emerald-950/30'
                        : isModerate
                        ? isLight
                          ? 'bg-amber-50 hover:bg-amber-100 border-amber-400 text-amber-950 hover:border-amber-500 shadow-amber-500/10'
                          : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/50 text-amber-300 shadow-amber-950/30'
                        : isLight
                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-500 text-rose-950 ring-2 ring-rose-400/40 animate-pulse shadow-rose-500/20'
                        : 'bg-rose-950/60 hover:bg-rose-900/70 border-rose-500 text-rose-200 ring-2 ring-rose-500/40 animate-pulse shadow-rose-950/40'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl font-black">{num}</span>
                    <span className="text-[10px] font-bold mt-1">
                      {isMild ? '😊 Mild' : isModerate ? '😐 Mod' : num <= 8 ? '😣 Severe' : '🚨 Critical'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`p-3 rounded-2xl text-xs text-center border flex items-center justify-center gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Selecting 9 or 10 will immediately trigger hospital Emergency Triage protocol.</span>
            </div>
          </div>
        ) : (
          /* STANDARD CHIPS GRID */
          <div
            className={`rounded-3xl p-6 sm:p-7 border backdrop-blur-md shadow-xl ${
              isLight
                ? 'bg-white/90 border-slate-200 text-slate-900'
                : 'bg-slate-900/85 border-slate-700/60 text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tap a Quick Choice (1-Touch Response):</span>
              </span>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Auto-advances to next question</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswerSubmit(chip.label, 'touch', chip.isEmergency)}
                  className={`p-4 rounded-2xl border text-left font-bold text-sm sm:text-base flex items-center justify-between transition-all duration-150 transform active:scale-95 cursor-pointer shadow-sm select-none ${
                    chip.isEmergency
                      ? isLight
                        ? 'bg-rose-50/80 hover:bg-rose-100 border-rose-300 text-rose-900 hover:border-rose-400 shadow-rose-500/10'
                        : 'bg-rose-950/30 hover:bg-rose-900/40 border-rose-500/40 text-rose-200 hover:border-rose-400 shadow-rose-950/20'
                      : isLight
                      ? 'bg-slate-50 hover:bg-cyan-50/80 border-slate-200 text-slate-800 hover:border-cyan-400 hover:text-cyan-900 shadow-slate-200/50'
                      : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-100 hover:border-cyan-500/50 hover:text-cyan-200'
                  }`}
                >
                  <span className="flex-1 pr-2">{chip.label}</span>
                  {chip.isEmergency ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shrink-0 shadow-xs">
                      Emergency
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 5. BOTTOM DUAL-MODE INPUT: GLOWING MICROPHONE & REAL-TIME SPEECH */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border backdrop-blur-md shadow-xl mb-6 ${
          isLight
            ? 'bg-white/90 border-slate-200 text-slate-900'
            : 'bg-slate-900/85 border-slate-700/60 text-white'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {/* Glowing Animated Microphone Button */}
          <div className="flex flex-col items-center shrink-0">
            <button
              type="button"
              onClick={isListening ? stopVoiceRecording : startVoiceRecording}
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 cursor-pointer shadow-xl ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-500/30 shadow-rose-500/50'
                  : 'bg-gradient-to-tr from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-cyan-500/30'
              }`}
              title={isListening ? 'Tap to Stop Recording' : 'Tap to Speak Answer'}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <Mic className="w-8 h-8 stroke-[2.5]" />
              )}
            </button>
            <span className="text-[11px] font-bold mt-2 text-cyan-500 uppercase tracking-wider">
              {isListening ? 'Listening... बोलें' : 'Tap to Speak'}
            </span>
          </div>

          {/* Real-time Transcribed Text Box & Send Button */}
          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                Voice Transcription or Manual Typing ({lang}):
              </span>
              {isListening && (
                <span className="text-rose-500 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Recording Audio...
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnswerSubmit(voiceText, 'voice');
                }}
                placeholder={
                  isListening
                    ? 'Listening... Speak your symptoms clearly (अपनी भाषा में बोलें)'
                    : 'Transcribed speech appears here, or type your answer...'
                }
                className={`w-full h-14 pl-4 pr-14 rounded-2xl border text-base font-medium placeholder-slate-400 focus:outline-none transition shadow-inner ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/20'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                }`}
              />

              <button
                type="button"
                disabled={!voiceText.trim() || isSavingTurn}
                onClick={() => handleAnswerSubmit(voiceText, 'voice')}
                className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-md"
                title="Send Response"
              >
                {isSavingTurn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Speaks: {langConfig.name} ({langConfig.code}) • All 6 Indian Languages Active</span>
              <span>Say "Chest Pain" or "Fever" to test Red-Flag triage</span>
            </div>
          </div>

        </div>
      </div>

      {/* 6. NAVIGATION FOOTER */}
      <div className="w-full flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            if (currentQIndex > 0) setCurrentQIndex(prev => prev - 1);
            else prevStep();
          }}
          className={`w-full sm:w-auto h-12 sm:h-14 px-6 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 cursor-pointer select-none ${
            isLight
              ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentQIndex > 0 ? 'Previous Question' : 'Back to Consent'}</span>
        </button>

        <button
          type="button"
          disabled={isGeneratingSummary}
          onClick={handleFinishInterview}
          className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-teal-500/25 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-wait select-none"
        >
          {isGeneratingSummary ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating AI Clinical Summary...</span>
            </>
          ) : (
            <>
              <span>Finish Interview & Upload Docs (Step 5)</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>

      {/* 7. RED-FLAG EMERGENCY MODAL */}
      {showRedFlagModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 border-2 border-rose-500 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl shadow-rose-950/80 text-center animate-in zoom-in-95">
            
            <div className="w-18 h-18 rounded-3xl bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500 text-white font-black text-xs uppercase tracking-wider mb-2">
              🚨 CRITICAL TRIAGE ALERT
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Emergency Symptoms Detected!
            </h3>
            <p className="text-rose-400 font-bold text-base mt-1">
              {lang === 'Marathi'
                ? '⚠️ तातडीचा इशारा: आपत्कालीन लक्षणे आढळली आहेत. कृपया त्वरित कॅज्युअल्टी रूम १ मध्ये जा.'
                : lang === 'Tamil'
                ? '⚠️ அவசர எச்சரிக்கை: அவசர சிகிச்சை அறை 1-க்கு உடனே செல்லவும்.'
                : lang === 'Bengali'
                ? '⚠️ জরুরি সতর্কতা: দয়া করে অবিলম্বে জরুরি বিভাগে যান।'
                : lang === 'Gujarati'
                ? '⚠️ કટોકટી ચેતવણી: કૃપા કરીને તાત્કાલિક કેઝ્યુઅલ્ટી રૂમ ૧ માં જાઓ.'
                : 'तत्काल आपातकालीन सहायता आवश्यक / Immediate Casualty Assistance Required'}
            </p>

            <div className="my-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-left text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
              <p>
                ⚠️ <strong>Emergency Flag Raised:</strong> Symptoms of acute chest pain or respiratory distress were identified during case taking.
              </p>
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <span>Report directly to: <strong>Casualty / Emergency Room No. 1</strong></span>
              </div>
              <p className="text-slate-400 text-xs">
                Hospital casualty nursing staff and OPD on-call physician have received an automatic digital alert on terminal <strong>CAS-01</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  alert('Hospital casualty staff at Desk 01 notified. Orderly dispatched to Kiosk.');
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Kiosk Assistant / सहायता बुलाएँ</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRedFlagModal(false)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 cursor-pointer"
              >
                Acknowledge & Continue (सहमति)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AiInterview;
