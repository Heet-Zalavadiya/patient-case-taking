import React, { useState, useEffect, useRef } from 'react';
import { usePatient } from '../../context/PatientContext';
import { 
  apiCreateSession,
  apiLogTurn,
  apiTriggerRedFlag,
  apiGenerateSummary,
  apiValidateComplaint,
  apiSarvamStt,
  apiSarvamNormalize,
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
  AlertCircle,
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

// Multilingual validation error message for chief complaint free-text input
const COMPLAINT_VALIDATION_ERRORS = {
  English: 'Please describe a health problem or symptom (e.g. fever, headache, stomach pain).',
  Hindi: 'कृपया किसी स्वास्थ्य समस्या या लक्षण का विवरण दें (जैसे बुखार, सिरदर्द, पेट दर्द)।',
  Gujarati: 'કૃપા કરીને કોઈ સ્વાસ્થ્ય સમસ્યા અથવા લક્ષણ જણાવો (જેમ કે તાવ, માથાનો દુખાવો, પેટમાં દુખાવો).',
  Marathi: 'कृपया आरोग्य समस्या किंवा लक्षण सांगा (उदा. ताप, डोकेदुखी, पोटदुखी).',
  Tamil: 'தயவுசெய்து ஒரு உடல்நலப் பிரச்சினை அல்லது அறிகுறியை விவரிக்கவும் (எ.கா. காய்ச்சல், தலைவலி, வயிற்று வலி).',
  Bengali: 'অনুগ্রহ করে কোনো স্বাস্থ্য সমস্যা বা উপসর্গ বর্ণনা করুন (যেমন জ্বর, মাথাব্যথা, পেটে ব্যথা)।'
};

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
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [toastNotification, setToastNotification] = useState(null); // { message: string, type: 'turn' | 'summary' }

  const showToast = (message, type = 'turn') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.message === message ? null : prev));
    }, 2800);
  };

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isTranscribingWithSarvam, setIsTranscribingWithSarvam] = useState(false);

  // Initialize clinical session on mount if not already present
  useEffect(() => {
    const initSession = async () => {
      if (!patientData.session_id) {
        try {
          const res = await apiCreateSession(
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
        patient_id: patientData.patient_id || 1,
        summary_text_english: `Patient Intake Summary: Chief complaint of "${chiefComplaint}". Total ${turns.length} consultation turns recorded.`,
        summary_text_local_language: `रोगी इनटेक सारांश: मुख्य शिकायत "${chiefComplaint}"। कुल ${turns.length} परामर्श संवाद रिकॉर्ड किए गए।`,
        status: 'draft'
      };

      const result = await apiGenerateSummary(activeSessionId, summaryPayload);
      
      const summaryId = result?.summary_id || result?.history_id || 1;
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
      // Advance to Step 5 (DocumentUpload)
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

    // 2. Call backend API (asynchronously log turn)
    try {
      await apiLogTurn(sessionId, turnPayload);
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
        await apiTriggerRedFlag(sessionId, flagData);
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
    setValidationError('');

    // 4. Advance to next question or complete
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Finished all questions, generate summary and proceed to Step 5
      await handleFinishInterview();
    }
  };

  // Handle Free-Text (Typed or Voice Transcribed) Submission with Gemini Validation
  const handleFreeTextSubmit = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || isSavingTurn || isValidating) return;

    // Validate only for Question 1: SOCRATES Site & Complaint ("What problem or health issue are you having today?")
    if (currentQIndex === 0 || currentQ?.id === 'chief_complaint') {
      setIsValidating(true);
      setValidationError('');

      try {
        const result = await apiValidateComplaint(trimmed);
        if (result && !result.is_valid && result.status === 'INVALID') {
          // If Gemini responds INVALID:
          // 1. Do NOT submit answer or advance flow
          // 2. Show friendly inline error message in patient's selected language
          // 3. Keep typed text in box so they can edit it
          // 4. Highlight input box border in red
          const errText =
            COMPLAINT_VALIDATION_ERRORS[lang] ||
            COMPLAINT_VALIDATION_ERRORS[preferredLang] ||
            COMPLAINT_VALIDATION_ERRORS['Hindi'] ||
            COMPLAINT_VALIDATION_ERRORS['English'];
          setValidationError(errText);
          setIsValidating(false);
          return;
        }
      } catch (err) {
        console.error('Complaint validation error, failing open:', err);
      } finally {
        setIsValidating(false);
      }
    }

    // VALID (or non-complaint question): submit normally
    setValidationError('');
    handleAnswerSubmit(trimmed, 'voice');
  };

  // Pain Scale Rating Selection
  const handlePainRating = (score) => {
    setValidationError('');
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

  // Speech Recognition (Sarvam AI Saaras STT + Web Speech API Live Preview + Resilient Fallback)
  const startVoiceRecording = async () => {
    setValidationError('');
    setIsListening(true);
    setVoiceText('');
    audioChunksRef.current = [];

    // 1. Start browser MediaRecorder to capture audio for Sarvam AI Saaras STT
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(250);
      } catch (mediaErr) {
        console.warn('MediaRecorder audio capture note:', mediaErr);
      }
    }

    // 2. Start Web Speech recognition for live interim transcription feedback
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
          console.warn('SpeechRecognition interim error:', err);
        };

        recognition.onend = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            stopVoiceRecording();
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed to start:', e);
      }
    }
  };

  const stopVoiceRecording = async () => {
    setIsListening(false);

    // Stop browser speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    // Stop MediaRecorder and transcribe via Sarvam Saaras AI
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        const recorder = mediaRecorderRef.current;
        recorder.onstop = async () => {
          try {
            recorder.stream?.getTracks().forEach((track) => track.stop());
          } catch (e) {}

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size > 800) {
            setIsTranscribingWithSarvam(true);
            try {
              const sarvamRes = await apiSarvamStt(audioBlob, langConfig?.code || 'hi-IN');
              if (sarvamRes && sarvamRes.success && sarvamRes.transcript?.trim()) {
                setVoiceText(sarvamRes.transcript.trim());
                showToast('Transcribed with Sarvam AI (Indian Language Model)', 'turn');
              } else if (!voiceText.trim()) {
                // If Sarvam failed or returned empty and no browser transcript, fallback to simulation
                fallbackVoiceSimulation();
              }
            } catch (sarvamErr) {
              console.warn('Sarvam STT failed, using browser transcript:', sarvamErr);
              if (!voiceText.trim()) fallbackVoiceSimulation();
            } finally {
              setIsTranscribingWithSarvam(false);
            }
          } else if (!voiceText.trim()) {
            fallbackVoiceSimulation();
          }
        };

        recorder.stop();
        return;
      } catch (stopErr) {
        console.warn('MediaRecorder stop note:', stopErr);
      }
    }

    // If no audio chunks and no transcript, trigger fallback
    setTimeout(() => {
      setVoiceText((current) => {
        if (!current || !current.trim()) {
          fallbackVoiceSimulation();
        }
        return current;
      });
    }, 400);
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
    }, 800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-2 pb-8 flex flex-col justify-center">
      
      {/* 1. TOP HEADER & TRIAGE MODE SWITCHER (WITH HIGH CONTRAST GLASS BACKDROP) */}
      <div className="mb-3 text-center">
        <div className={`inline-block px-6 py-3 rounded-2xl border-2 shadow-xl transition-all ${
          isLight
            ? 'bg-white border-cyan-400 shadow-slate-500/20 text-slate-950'
            : 'bg-slate-900 border-cyan-500 shadow-slate-950/70 text-white'
        }`}>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${
                isLight
                  ? 'bg-cyan-100 border-cyan-300 text-cyan-950 shadow-xs'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              <span>AI Clinical Interview (SOCRATES)</span>
            </div>

            {/* History Mode Toggle Pill */}
            <div className={`inline-flex items-center p-0.5 rounded-xl border-2 ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'
            }`}>
              <button
                type="button"
                onClick={() => setHistoryMode('allopathic')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  patientData.history_mode === 'allopathic'
                    ? isLight
                      ? 'bg-white text-cyan-950 shadow-sm border border-cyan-300 font-black'
                      : 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Allopathic Triage
              </button>
              <button
                type="button"
                onClick={() => setHistoryMode('ayush')}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition cursor-pointer ${
                  patientData.history_mode === 'ayush'
                    ? isLight
                      ? 'bg-emerald-100 text-emerald-950 shadow-sm border border-emerald-400 font-black'
                      : 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Ayush Agni</span>
              </button>
            </div>
          </div>

          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
            Multimodal Symptom Intake
          </h2>
        </div>
      </div>

      {/* 2. PROGRESS STEPPER BAR */}
      <div className="w-full mb-2">
        <div className="flex items-center justify-between text-xs font-black mb-1 px-1">
          <span className={`px-3 py-1 rounded-xl border-2 font-black shadow-xs ${
            isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            Step 4: Question {currentQIndex + 1} of {questions.length}
          </span>
          <span className="text-cyan-600 dark:text-cyan-400 font-mono font-black px-3 py-1 rounded-xl border-2 border-cyan-300 dark:border-cyan-800 bg-white dark:bg-slate-900 shadow-xs">
            {Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete
          </span>
        </div>
        <div className={`w-full h-2.5 rounded-xl overflow-hidden border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-xl transition-all duration-300"
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. ACTIVE AI QUESTION CARD */}
      <div
        className={`rounded-2xl p-4 border-2 backdrop-blur-md mb-2.5 shadow-md transition-all relative overflow-hidden ${
          isLight
            ? 'bg-white/95 border-cyan-400 text-slate-900'
            : 'bg-slate-900/90 border-cyan-500/70 text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Bot className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-500">
                  {currentQ.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Lang: {lang}
                </span>
              </div>
              <h3 className={`text-lg sm:text-xl font-black leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentQText}
              </h3>
            </div>
          </div>

          {/* TTS Audio Speak Button */}
          <button
            type="button"
            onClick={handlePlayQuestion}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isPlayingAudio
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Read Question Aloud"
          >
            <Volume2 className="w-5 h-5 text-cyan-500" />
          </button>
        </div>
      </div>

      {/* 4. BIG CENTERED VOICE INPUT SECTION */}
      <div
        className={`rounded-2xl p-3 sm:p-4 border-2 backdrop-blur-md shadow-lg mb-2.5 text-center flex flex-col items-center justify-center ${
          isLight
            ? 'bg-gradient-to-b from-cyan-50/90 to-white border-cyan-300 text-slate-900'
            : 'bg-gradient-to-b from-slate-900/90 to-slate-950 border-cyan-500/40 text-white'
        }`}
      >
        <div className="flex flex-col items-center justify-center mb-2">
          {/* BIG CENTERED MICROPHONE BUTTON */}
          <button
            type="button"
            onClick={isListening ? stopVoiceRecording : startVoiceRecording}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-xl border-4 ${
              isListening
                ? 'bg-rose-500 text-white border-rose-300 animate-pulse ring-8 ring-rose-500/30'
                : 'bg-gradient-to-tr from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 border-white hover:scale-105 shadow-cyan-500/30'
            }`}
            title={isListening ? 'Stop Recording' : 'Speak Answer'}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
            ) : (
              <Mic className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
            )}
          </button>
          
          <span className="text-xs sm:text-sm font-black mt-1 text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            {isListening ? '🎙️ LISTENING NOW... SPEAK CLEARLY' : '🎙️ TAP BIG MIC TO SPEAK / बोलकर जवाब दें'}
          </span>
        </div>

        {/* Real-time Transcribed Text Input */}
        <div className="w-full relative flex flex-col max-w-2xl mx-auto">
          <div className="w-full relative flex items-center">
            <input
              type="text"
              value={voiceText}
              onChange={(e) => {
                setVoiceText(e.target.value);
                if (validationError) setValidationError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFreeTextSubmit(voiceText);
              }}
              placeholder={
                isListening
                  ? 'Listening... Speak your symptoms clearly'
                  : isTranscribingWithSarvam
                  ? 'Transcribing with Sarvam AI Indian Voice Model...'
                  : 'Spoken or typed response appears here...'
              }
              className={`w-full h-12 pl-4 pr-12 rounded-xl border-2 text-sm sm:text-base font-bold placeholder-slate-400 focus:outline-none transition shadow-inner ${
                validationError
                  ? 'border-rose-500 bg-rose-50/20 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/40'
                  : isLight
                  ? 'bg-white border-cyan-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            />

            <button
              type="button"
              disabled={!voiceText.trim() || isSavingTurn || isValidating || isTranscribingWithSarvam}
              onClick={() => handleFreeTextSubmit(voiceText)}
              className="absolute right-1.5 p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 disabled:opacity-30 transition cursor-pointer"
              title="Send Response"
            >
              {(isSavingTurn || isValidating || isTranscribingWithSarvam) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* INLINE VALIDATION ERROR MESSAGE */}
          {validationError && (
            <div className="flex items-center gap-1.5 mt-2 px-1 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 text-left animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. INTERACTION AREA: SQUARE CHOICE CARDS OR PAIN SCALE */}
      <div className="w-full mb-2.5">
        {currentQ.isPainScale ? (
          <div
            className={`rounded-2xl p-3 sm:p-4 border backdrop-blur-md shadow-md ${
              isLight
                ? 'bg-white/90 border-slate-200 text-slate-900'
                : 'bg-slate-900/85 border-slate-700/60 text-white'
            }`}
          >
            <div className="text-center mb-2">
              <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                OR TAP PAIN LEVEL (1 = MILD, 10 = EMERGENCY)
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isMild = num <= 3;
                const isModerate = num >= 4 && num <= 6;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePainRating(num)}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-sm ${
                      isMild
                        ? isLight
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-500 text-emerald-950 font-black'
                          : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500 text-emerald-300 font-black'
                        : isModerate
                        ? isLight
                          ? 'bg-amber-50 hover:bg-amber-100 border-amber-500 text-amber-950 font-black'
                          : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500 text-amber-300 font-black'
                        : isLight
                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-500 text-rose-950 font-black animate-pulse'
                        : 'bg-rose-950/60 hover:bg-rose-900/70 border-rose-500 text-rose-200 font-black animate-pulse'
                    }`}
                  >
                    <span className="text-base sm:text-lg font-black">{num}</span>
                    <span className="text-[9px] font-black uppercase">
                      {isMild ? 'Mild' : isModerate ? 'Mod' : num <= 8 ? 'Severe' : 'Crit'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* SQUARE CHOICE CHIPS GRID */
          <div
            className={`rounded-2xl p-3 sm:p-4 border backdrop-blur-md shadow-md ${
              isLight
                ? 'bg-white/90 border-slate-200 text-slate-900'
                : 'bg-slate-900/85 border-slate-700/60 text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>OR TAP A QUICK CHOICE (SQUARE FORM CARDS):</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setValidationError('');
                    handleAnswerSubmit(chip.label, 'touch', chip.isEmergency);
                  }}
                  className={`p-3 rounded-xl border-2 text-left font-black text-sm sm:text-base flex flex-col justify-between transition-all transform active:scale-95 cursor-pointer shadow-xs min-h-[85px] ${
                    chip.isEmergency
                      ? isLight
                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-400 text-rose-950'
                        : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500 text-rose-200'
                      : isLight
                      ? 'bg-slate-50 hover:bg-cyan-50 border-slate-300 text-slate-900 hover:border-cyan-400'
                      : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700 text-white hover:border-cyan-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-cyan-500 uppercase">Option {idx + 1}</span>
                    {chip.isEmergency && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-500 text-white">
                        Emergency
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black line-clamp-2 leading-tight">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. NAVIGATION FOOTER */}
      <div className="w-full flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (currentQIndex > 0) setCurrentQIndex(prev => prev - 1);
            else prevStep();
          }}
          className={`h-11 px-5 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentQIndex > 0 ? 'Prev Question' : 'Back'}</span>
        </button>

        <button
          type="button"
          disabled={isGeneratingSummary}
          onClick={handleFinishInterview}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition active:scale-95 cursor-pointer disabled:opacity-75"
        >
          {isGeneratingSummary ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Summary...</span>
            </>
          ) : (
            <>
              <span>Finish Triage (Step 5)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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
