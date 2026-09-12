import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { speakPhrase } from '../../utils/speechUtils';
import { 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  MapPin, 
  RefreshCw, 
  Check 
} from 'lucide-react';

const REGIONS = [
  'Head & Face',
  'Neck & Throat',
  'Chest & Ribs',
  'Stomach & Abdomen',
  'Hips & Pelvis',
  'Right Arm & Hand',
  'Left Arm & Hand',
  'Right Leg & Knee',
  'Left Leg & Knee'
];

const BODY_MAP_TRANSLATIONS = {
  English: {
    heading: 'Where does it hurt?',
    subtext: 'Tap directly on any body part to pinpoint your exact pain location.',
    listenAgain: 'LISTEN AGAIN',
    playing: 'Playing...',
    anatomyView: 'ANATOMY VIEW:',
    front: 'Front',
    back: 'Back',
    flipToBack: 'Flip to Back View',
    flipToFront: 'Flip to Front View',
    orTapRegion: 'OR TAP A REGION NAME:',
    confirmContinue: 'Confirm & Continue',
    skipStep: 'Skip this step',
    backBtn: 'Back',
    regions: {
      'Head & Face': 'Head & Face',
      'Neck & Throat': 'Neck & Throat',
      'Chest & Ribs': 'Chest & Ribs',
      'Stomach & Abdomen': 'Stomach & Abdomen',
      'Hips & Pelvis': 'Hips & Pelvis',
      'Right Arm & Hand': 'Right Arm & Hand',
      'Left Arm & Hand': 'Left Arm & Hand',
      'Right Leg & Knee': 'Right Leg & Knee',
      'Left Leg & Knee': 'Left Leg & Knee'
    }
  },
  Hindi: {
    heading: 'दर्द कहाँ हो रहा है?',
    subtext: 'अपने दर्द की सही जगह बताने के लिए शरीर के किसी भी हिस्से पर टैप करें।',
    listenAgain: 'फिर से सुनें',
    playing: 'चल रहा है...',
    anatomyView: 'शरीर दृश्य:',
    front: 'आगे',
    back: 'पीछे',
    flipToBack: 'पीछे का दृश्य देखें',
    flipToFront: 'आगे का दृश्य देखें',
    orTapRegion: 'या नीचे दिए गए अंग पर टैप करें:',
    confirmContinue: 'पुष्टि करें और आगे बढ़ें',
    skipStep: 'यह चरण छोड़ें',
    backBtn: 'पीछे',
    regions: {
      'Head & Face': 'सिर और चेहरा',
      'Neck & Throat': 'गर्दन और गला',
      'Chest & Ribs': 'छाती और पसलियां',
      'Stomach & Abdomen': 'पेट',
      'Hips & Pelvis': 'कमर और कूल्हा',
      'Right Arm & Hand': 'दायां हाथ',
      'Left Arm & Hand': 'बायां हाथ',
      'Right Leg & Knee': 'दायां पैर व घुटना',
      'Left Leg & Knee': 'बायां पैर व घुटना'
    }
  },
  Gujarati: {
    heading: 'ક્યાં દુખાવો થાય છે?',
    subtext: 'તમારા દુખાવાની ચોક્કસ જગ્યા દર્શાવવા માટે શરીરના કોઈપણ ભાગ પર ટેપ કરો.',
    listenAgain: 'ફરીથી સાંભળો',
    playing: 'વાગી રહ્યું છે...',
    anatomyView: 'શરીર દૃશ્ય:',
    front: 'આગળ',
    back: 'પાછળ',
    flipToBack: 'પાછળનું દૃશ્ય જુઓ',
    flipToFront: 'આગળનું દૃશ્ય જુઓ',
    orTapRegion: 'અથવા નીચેના અંગના નામ પર ટેપ કરો:',
    confirmContinue: 'પુષ્ટિ કરો અને આગળ વધો',
    skipStep: 'આ પગલું છોડો',
    backBtn: 'પાછળ',
    regions: {
      'Head & Face': 'માથું અને ચહેરો',
      'Neck & Throat': 'ગરદન અને ગળું',
      'Chest & Ribs': 'છાતી અને પાંસળીઓ',
      'Stomach & Abdomen': 'પેટ',
      'Hips & Pelvis': 'કમર અને થાપો',
      'Right Arm & Hand': 'જમણો હાથ',
      'Left Arm & Hand': 'ડાબો હાથ',
      'Right Leg & Knee': 'જમણો પગ અને ઘૂંટણ',
      'Left Leg & Knee': 'ડાબો પગ અને ઘૂંટણ'
    }
  },
  Marathi: {
    heading: 'वेदना कुठे होत आहे?',
    subtext: 'तुमच्या वेदनेचे अचूक स्थान दर्शवण्यासाठी शरीराच्या कोणत्याही भागावर टॅप करा.',
    listenAgain: 'पुन्हा ऐका',
    playing: 'सुरू आहे...',
    anatomyView: 'शरीर दृश्य:',
    front: 'समोर',
    back: 'पाठीमागे',
    flipToBack: 'पाठीमागचे दृश्य पहा',
    flipToFront: 'समोरचे दृश्य पहा',
    orTapRegion: 'किंवा खालील अवयवाच्या नावावर टॅप करा:',
    confirmContinue: 'पुष्टी करा आणि पुढे जा',
    skipStep: 'हा टप्पा वगळा',
    backBtn: 'मागे',
    regions: {
      'Head & Face': 'डोके आणि चेहरा',
      'Neck & Throat': 'मान आणि घसा',
      'Chest & Ribs': 'छाती आणि बरगड्या',
      'Stomach & Abdomen': 'पोट',
      'Hips & Pelvis': 'कंबर आणि नितंब',
      'Right Arm & Hand': 'उजवा हात',
      'Left Arm & Hand': 'डावा हात',
      'Right Leg & Knee': 'उजवा पाय आणि गुडघा',
      'Left Leg & Knee': 'डावा पाय आणि गुडघा'
    }
  },
  Tamil: {
    heading: 'எங்கு வலிக்கிறது?',
    subtext: 'உங்கள் வலி உள்ள இடத்தை துல்லியமாக குறிக்க உடலின் எந்த பகுதியையும் தட்டவும்.',
    listenAgain: 'மீண்டும் கேட்க',
    playing: 'ஒலிக்கிறது...',
    anatomyView: 'உடல் பார்வை:',
    front: 'முன்புறம்',
    back: 'பின்புறம்',
    flipToBack: 'பின்புற பார்வைக்கு மாற்றவும்',
    flipToFront: 'முன்புற பார்வைக்கு மாற்றவும்',
    orTapRegion: 'அல்லது கீழ் உள்ள உடல் பகுதியைத் தேர்ந்தெடுக்கவும்:',
    confirmContinue: 'உறுதிசெய்து தொடரவும்',
    skipStep: 'இந்த படியைத் தவிர்க்கவும்',
    backBtn: 'பின்செல்',
    regions: {
      'Head & Face': 'தலை & முகம்',
      'Neck & Throat': 'கழுத்து & தொண்டை',
      'Chest & Ribs': 'மார்பு & விலா எலும்புகள்',
      'Stomach & Abdomen': 'வயிறு',
      'Hips & Pelvis': 'இடுப்பு & அடிவயிறு',
      'Right Arm & Hand': 'வலது கை',
      'Left Arm & Hand': 'இடது கை',
      'Right Leg & Knee': 'வலது கால் & முழங்கால்',
      'Left Leg & Knee': 'இடது கால் & முழங்கால்'
    }
  },
  Bengali: {
    heading: 'কোথায় ব্যথা করছে?',
    subtext: 'আপনার ব্যথার সঠিক স্থান চিহ্নিত করতে শরীরের যেকোনো অংশে স্পর্শ করুন।',
    listenAgain: 'আবার শুনুন',
    playing: 'শোনাচ্ছে...',
    anatomyView: 'শারীরিক দৃশ্য:',
    front: 'সামনে',
    back: 'পেছনে',
    flipToBack: 'পেছনের দৃশ্য দেখুন',
    flipToFront: 'সামনের দৃশ্য দেখুন',
    orTapRegion: 'অথবা অঙ্গের নামের ওপর ট্যাপ করুন:',
    confirmContinue: 'নিশ্চিত করুন এবং এগিয়ে যান',
    skipStep: 'এই ধাপটি এড়িয়ে যান',
    backBtn: 'ফিরে যান',
    regions: {
      'Head & Face': 'মাথা ও মুখ',
      'Neck & Throat': 'ঘাড় ও গলা',
      'Chest & Ribs': 'বুক ও পাঁজরা',
      'Stomach & Abdomen': 'পেট',
      'Hips & Pelvis': 'কোমর ও শ্রোণী',
      'Right Arm & Hand': 'ডান হাত',
      'Left Arm & Hand': 'বাম হাত',
      'Right Leg & Knee': 'ডান পা ও হাঁটু',
      'Left Leg & Knee': 'বাম পা ও হাঁটু'
    }
  }
};

export const BodyMapStep = () => {
  const { patientData, theme, nextStep, prevStep, setPainLocations } = usePatient();
  const isLight = theme === 'light';

  const currentLang = patientData.preferred_language || 'Hindi';
  const t = BODY_MAP_TRANSLATIONS[currentLang] || BODY_MAP_TRANSLATIONS['Hindi'] || BODY_MAP_TRANSLATIONS['English'];

  const [isBackView, setIsBackView] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState(
    patientData.painLocations || patientData.pain_locations || []
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Toggle selection of a body region (keeps canonical English IDs in state)
  const toggleRegion = (region) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const isSelected = (region) => selectedRegions.includes(region);

  // Text-To-Speech announcement in patient's selected language
  const handleListenAgain = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    const speechText = `${t.heading} ${t.subtext}`;
    try {
      await speakPhrase(speechText, currentLang);
    } catch (err) {
      console.warn('TTS playback error:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Proceed with selected regions
  const handleContinue = () => {
    if (selectedRegions.length === 0) return;
    setPainLocations(selectedRegions);
    nextStep();
  };

  // Skip step entirely
  const handleSkip = () => {
    setPainLocations([]);
    nextStep();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4 relative animate-in fade-in duration-300">
      
      {/* TOP-LEFT BACK BUTTON */}
      <button
        type="button"
        onClick={prevStep}
        className={`fixed top-4 left-4 z-40 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl border-2 backdrop-blur-xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-xl flex items-center gap-2 ${
          isLight
            ? 'bg-white/90 hover:bg-slate-100 border-slate-300 text-slate-800 shadow-slate-400/20'
            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-white shadow-slate-950/60'
        }`}
        title={t.backBtn}
      >
        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        <span className="text-xs font-black hidden sm:inline">{t.backBtn}</span>
      </button>

      {/* MAIN STEP CARD */}
      <div
        className={`w-full rounded-[28px] p-6 sm:p-8 shadow-2xl border transition-all text-center flex flex-col items-center ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-slate-400/15 text-slate-900'
            : 'bg-slate-900/90 border-slate-700/80 shadow-slate-950/70 text-slate-100 backdrop-blur-xl'
        }`}
      >
        {/* HEADING & SUBTEXT */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-serif">
          {t.heading}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 font-medium max-w-md">
          {t.subtext}
        </p>

        {/* LISTEN AGAIN TTS BUTTON */}
        <button
          type="button"
          onClick={handleListenAgain}
          disabled={isPlayingAudio}
          className="mt-2.5 inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer transition hover:underline active:scale-95"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse text-cyan-500' : ''}`} />
          <span>{isPlayingAudio ? t.playing : t.listenAgain}</span>
        </button>

        {/* ANATOMY CARD / PANEL */}
        <div
          className={`w-full mt-5 rounded-2xl border p-4 sm:p-6 shadow-xs flex flex-col items-center ${
            isLight
              ? 'bg-slate-50/50 border-slate-200'
              : 'bg-slate-800/50 border-slate-750'
          }`}
        >
          {/* PANEL HEADER CONTROLS */}
          <div className="w-full flex items-center justify-between mb-4 select-none">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-500" />
              <span>{t.anatomyView} <strong className="text-slate-900 dark:text-white">{isBackView ? t.back : t.front}</strong></span>
            </span>

            <button
              type="button"
              onClick={() => setIsBackView(!isBackView)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition active:scale-95 cursor-pointer shadow-xs ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isBackView ? t.flipToFront : t.flipToBack}</span>
            </button>
          </div>

          {/* SVG HUMAN BODY DIAGRAM */}
          <div className="relative w-full max-w-[260px] h-[260px] flex items-center justify-center my-1 select-none">
            <svg
              viewBox="0 0 200 320"
              className="w-full h-full drop-shadow-xs transition-transform duration-300"
            >
              <defs>
                {/* Visual glow on hover / active */}
                <filter id="partGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#0284c7" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* 1. HEAD & FACE */}
              <g
                onClick={() => toggleRegion('Head & Face')}
                className="cursor-pointer transition-all"
                title={t.regions['Head & Face'] || 'Head & Face'}
              >
                <circle
                  cx="100"
                  cy="36"
                  r="22"
                  fill={isSelected('Head & Face') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Head & Face') ? '0.45' : '0'}
                  stroke={isSelected('Head & Face') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
                {/* Center marker dot */}
                <circle cx="100" cy="36" r="1.5" fill={isSelected('Head & Face') ? '#0284c7' : '#94a3b8'} />
              </g>

              {/* 2. NECK & THROAT */}
              <g
                onClick={() => toggleRegion('Neck & Throat')}
                className="cursor-pointer transition-all"
                title={t.regions['Neck & Throat'] || 'Neck & Throat'}
              >
                <rect
                  x="93"
                  y="58"
                  width="14"
                  height="14"
                  rx="2"
                  fill={isSelected('Neck & Throat') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Neck & Throat') ? '0.45' : '0'}
                  stroke={isSelected('Neck & Throat') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
              </g>

              {/* 3. CHEST & RIBS */}
              <g
                onClick={() => toggleRegion('Chest & Ribs')}
                className="cursor-pointer transition-all"
                title={t.regions['Chest & Ribs'] || 'Chest & Ribs'}
              >
                <path
                  d="M 68 72 L 132 72 L 126 122 L 74 122 Z"
                  fill={isSelected('Chest & Ribs') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Chest & Ribs') ? '0.45' : '0'}
                  stroke={isSelected('Chest & Ribs') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
                <circle cx="100" cy="95" r="1.5" fill={isSelected('Chest & Ribs') ? '#0284c7' : '#94a3b8'} />
                {isBackView && (
                  <line x1="100" y1="72" x2="100" y2="122" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                )}
              </g>

              {/* 4. STOMACH & ABDOMEN */}
              <g
                onClick={() => toggleRegion('Stomach & Abdomen')}
                className="cursor-pointer transition-all"
                title={t.regions['Stomach & Abdomen'] || 'Stomach & Abdomen'}
              >
                <path
                  d="M 74 122 L 126 122 L 122 165 L 78 165 Z"
                  fill={isSelected('Stomach & Abdomen') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Stomach & Abdomen') ? '0.45' : '0'}
                  stroke={isSelected('Stomach & Abdomen') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
                <circle cx="100" cy="142" r="1.5" fill={isSelected('Stomach & Abdomen') ? '#0284c7' : '#94a3b8'} />
                {isBackView && (
                  <line x1="100" y1="122" x2="100" y2="165" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                )}
              </g>

              {/* 5. HIPS & PELVIS */}
              <g
                onClick={() => toggleRegion('Hips & Pelvis')}
                className="cursor-pointer transition-all"
                title={t.regions['Hips & Pelvis'] || 'Hips & Pelvis'}
              >
                <path
                  d="M 78 165 L 122 165 L 115 195 L 85 195 Z"
                  fill={isSelected('Hips & Pelvis') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Hips & Pelvis') ? '0.45' : '0'}
                  stroke={isSelected('Hips & Pelvis') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
              </g>

              {/* 6. RIGHT ARM & HAND (Left from viewer perspective) */}
              <g
                onClick={() => toggleRegion('Right Arm & Hand')}
                className="cursor-pointer transition-all"
                title={t.regions['Right Arm & Hand'] || 'Right Arm & Hand'}
              >
                <path
                  d="M 68 72 L 50 150 L 44 200 L 49 200 L 58 152 L 73 80 Z"
                  fill={isSelected('Right Arm & Hand') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Right Arm & Hand') ? '0.45' : '0'}
                  stroke={isSelected('Right Arm & Hand') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
              </g>

              {/* 7. LEFT ARM & HAND (Right from viewer perspective) */}
              <g
                onClick={() => toggleRegion('Left Arm & Hand')}
                className="cursor-pointer transition-all"
                title={t.regions['Left Arm & Hand'] || 'Left Arm & Hand'}
              >
                <path
                  d="M 132 72 L 150 150 L 156 200 L 151 200 L 142 152 L 127 80 Z"
                  fill={isSelected('Left Arm & Hand') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Left Arm & Hand') ? '0.45' : '0'}
                  stroke={isSelected('Left Arm & Hand') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
              </g>

              {/* 8. RIGHT LEG & KNEE (Left from viewer perspective) */}
              <g
                onClick={() => toggleRegion('Right Leg & Knee')}
                className="cursor-pointer transition-all"
                title={t.regions['Right Leg & Knee'] || 'Right Leg & Knee'}
              >
                <path
                  d="M 85 195 L 98 195 L 96 280 L 98 305 L 86 305 L 83 280 Z"
                  fill={isSelected('Right Leg & Knee') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Right Leg & Knee') ? '0.45' : '0'}
                  stroke={isSelected('Right Leg & Knee') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
                <circle cx="91" cy="245" r="1.5" fill={isSelected('Right Leg & Knee') ? '#0284c7' : '#94a3b8'} />
              </g>

              {/* 9. LEFT LEG & KNEE (Right from viewer perspective) */}
              <g
                onClick={() => toggleRegion('Left Leg & Knee')}
                className="cursor-pointer transition-all"
                title={t.regions['Left Leg & Knee'] || 'Left Leg & Knee'}
              >
                <path
                  d="M 102 195 L 115 195 L 117 280 L 114 305 L 102 305 L 104 280 Z"
                  fill={isSelected('Left Leg & Knee') ? '#38bdf8' : 'transparent'}
                  fillOpacity={isSelected('Left Leg & Knee') ? '0.45' : '0'}
                  stroke={isSelected('Left Leg & Knee') ? '#0284c7' : '#94a3b8'}
                  strokeWidth="2"
                  className="hover:stroke-cyan-500 hover:fill-cyan-100/30 transition-colors"
                />
                <circle cx="109" cy="245" r="1.5" fill={isSelected('Left Leg & Knee') ? '#0284c7' : '#94a3b8'} />
              </g>
            </svg>
          </div>

          {/* DIVIDER & SECTION TITLE */}
          <div className="w-full flex items-center justify-center my-3 relative select-none">
            <div className="w-full border-t border-slate-200 dark:border-slate-700 absolute"></div>
            <span className={`relative px-3 text-[11px] font-bold uppercase tracking-wider ${
              isLight ? 'bg-slate-50/50 text-slate-400' : 'bg-slate-800/50 text-slate-400'
            }`}>
              {t.orTapRegion}
            </span>
          </div>

          {/* REGION PILL BUTTONS */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2 mt-1">
            {REGIONS.map((region) => {
              const active = isSelected(region);
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => toggleRegion(region)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    active
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold border-cyan-500 dark:border-cyan-400 shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {active && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{t.regions[region] || region}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PRIMARY ACTION BUTTON */}
        <div className="w-full mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedRegions.length === 0}
            className={`w-full h-13 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
              selectedRegions.length === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                : 'bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-cyan-500/25 active:scale-98 cursor-pointer ring-2 ring-cyan-400/50'
            }`}
          >
            <span>{t.confirmContinue}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* SKIP THIS STEP LINK */}
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline-offset-4 hover:underline cursor-pointer py-1 transition"
          >
            {t.skipStep}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BodyMapStep;
