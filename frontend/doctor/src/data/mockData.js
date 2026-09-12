/**
 * MediKiosk Clinical Schema Contract & Day 1 Mock Datasets
 * Designed for SIH26047 AI-powered Patient Intake & Case-Taking Platform
 * "I make the doctor's information easy to understand" - 30-second rapid review
 */

export const doctors = [
  {
    doctor_id: "doc_101",
    login_id: "dr.anand",
    name: "Dr. Anand Kulkarni",
    qualification: "BAMS, MD (Ayurveda), PhD (Kayachikitsa)",
    department: "General Medicine & Kayachikitsa",
    institution: "All India Institute of Ayurveda • Ministry of AYUSH",
    is_ayush_practitioner: true,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    active_opd_room: "OPD Room #14"
  },
  {
    doctor_id: "doc_102",
    login_id: "dr.rajesh",
    name: "Dr. Rajesh Sharma",
    qualification: "MBBS, MD (Internal Medicine)",
    department: "Department of Clinical & Internal Medicine",
    institution: "All India Institute of Ayurveda & Central Hospital",
    is_ayush_practitioner: false,
    avatar: "https://images.unsplash.com/photo-1594824813580-77a83d78c3b7?w=150&auto=format&fit=crop&q=80",
    active_opd_room: "OPD Room #104"
  }
];

export const patients = [
  {
    patient_id: "pat_001",
    mrn: "AIIA-2026-9812",
    full_name: "Ramesh Kumar",
    age: 58,
    gender: "Male",
    phone: "+91 98112 34567",
    blood_group: "B+",
    vitals_summary: {
      bp: "168/102 mmHg",
      pulse: "108 bpm",
      spo2: "91%",
      temp: "98.8 °F",
      rr: "26 /min"
    },
    triage_category: "Emergency / Priority 1"
  },
  {
    patient_id: "pat_002",
    mrn: "AIIA-2026-4431",
    full_name: "Sunita Devi",
    age: 46,
    gender: "Female",
    phone: "+91 98450 87123",
    blood_group: "O+",
    vitals_summary: {
      bp: "124/80 mmHg",
      pulse: "74 bpm",
      spo2: "98%",
      temp: "98.4 °F",
      rr: "18 /min"
    },
    triage_category: "Chronic Care OPD"
  },
  {
    patient_id: "pat_003",
    mrn: "AIIA-2026-7789",
    full_name: "Arjun Patel",
    age: 32,
    gender: "Male",
    phone: "+91 97234 11980",
    blood_group: "A+",
    vitals_summary: {
      bp: "138/88 mmHg",
      pulse: "112 bpm",
      spo2: "93%",
      temp: "99.1 °F",
      rr: "28 /min"
    },
    triage_category: "Urgent Medical"
  },
  {
    patient_id: "pat_004",
    mrn: "AIIA-2026-2104",
    full_name: "Meera Nambiar",
    age: 61,
    gender: "Female",
    phone: "+91 94471 66231",
    blood_group: "AB+",
    vitals_summary: {
      bp: "130/84 mmHg",
      pulse: "76 bpm",
      spo2: "97%",
      temp: "98.2 °F",
      rr: "17 /min"
    },
    triage_category: "Standard OPD"
  }
];

export const clinical_sessions = [
  {
    session_id: "sess_101",
    patient_id: "pat_001",
    queue_number: "Q-01",
    token: "EM-101",
    check_in_time: "12:35 PM",
    history_mode: "allopathic",
    status: "waiting",
    consultation_notes: ""
  },
  {
    session_id: "sess_102",
    patient_id: "pat_002",
    queue_number: "Q-02",
    token: "AY-202",
    check_in_time: "12:42 PM",
    history_mode: "ayush",
    status: "waiting",
    consultation_notes: ""
  },
  {
    session_id: "sess_103",
    patient_id: "pat_003",
    queue_number: "Q-03",
    token: "AL-103",
    check_in_time: "12:50 PM",
    history_mode: "allopathic",
    status: "waiting",
    consultation_notes: ""
  },
  {
    session_id: "sess_104",
    patient_id: "pat_004",
    queue_number: "Q-04",
    token: "AY-204",
    check_in_time: "01:05 PM",
    history_mode: "ayush",
    status: "waiting",
    consultation_notes: ""
  }
];

export const red_flag_alerts = [
  {
    alert_id: "rf_901",
    session_id: "sess_101",
    symptom: "Acute substernal crushing chest pain radiating to left arm & mandibular jaw with profuse diaphoresis and SpO2 91%",
    severity: "CRITICAL",
    timestamp: "12:38 PM (10 mins ago)",
    vital_triggers: ["BP: 168/102 mmHg", "SpO2: 91% on room air", "Pulse: 108 bpm irregular"],
    is_acknowledged: false,
    recommended_triage: "IMMEDIATE 12-Lead ECG, O2 Support, STAT Troponin I, Keep Crash Cart on standby"
  },
  {
    alert_id: "rf_902",
    session_id: "sess_103",
    symptom: "Severe acute bronchospasm with expiratory wheezing, tachypnea (RR 28), and refractory response to home rescue bronchodilators",
    severity: "HIGH",
    timestamp: "12:52 PM (18 mins ago)",
    vital_triggers: ["SpO2: 93% on room air", "RR: 28 /min", "PEFR: 55% predicted"],
    is_acknowledged: false,
    recommended_triage: "Nebulized Beta-2 Agonist + Ipratropium, Supplemental Oxygen, High-Fowler positioning"
  }
];

export const structured_history = [
  {
    session_id: "sess_101",
    chief_complaint: "Severe retrosternal squeezing chest pain and shortness of breath for 45 minutes",
    duration: "45 minutes (Acute onset)",
    hpi: {
      onset: "Sudden onset while walking upstairs at approximately 12:00 PM today.",
      character: "Severe crushing retrosternal pressure, described as 'an elephant sitting on the chest' (Pain score: 9/10).",
      radiation: "Radiates down the medial aspect of the left arm to the ring/little finger and upwards into the left jaw.",
      aggravating_relieving: "Worsens with any exertion. No relief with rest or sublingual sorbitrate tablet taken at home.",
      associated_symptoms: "Profuse cold diaphoresis, acute breathlessness, lightheadedness, and mild nausea without emesis."
    },
    past_medical: {
      chronic_illnesses: ["Essential Hypertension (8 years, moderately controlled)", "Type 2 Diabetes Mellitus (6 years, HbA1c 7.9% last month)", "Dyslipidemia (4 years)"],
      past_surgeries: ["Appendectomy (open) in 2011 - uncomplicated"],
      prior_hospitalizations: ["Admitted in 2022 for diabetic foot cellulitis - resolved with IV antibiotics"]
    },
    drug_allergies: {
      known_allergies: [
        { allergen: "Penicillin", reaction: "Diffuse urticarial rash & facial angioedema", severity: "Severe" },
        { allergen: "Aspirin (plain)", reaction: "Severe epigastric pain / dyspepsia (tolerates enteric-coated)", severity: "Moderate" }
      ],
      current_medications: [
        { name: "Tab Telmisartan", dosage: "40 mg", frequency: "OD (Morning)", indication: "Hypertension" },
        { name: "Tab Metformin", dosage: "500 mg", frequency: "BD (After meals)", indication: "Diabetes" },
        { name: "Tab Atorvastatin", dosage: "20 mg", frequency: "HS (Bedtime)", indication: "Dyslipidemia" }
      ]
    },
    family_history: {
      cardiovascular: "Father suffered fatal myocardial infarction at age 52.",
      metabolic: "Mother has Type 2 Diabetes and chronic kidney disease stage 3.",
      siblings: "Elder brother had coronary stent placed at age 55."
    },
    ros: {
      cardiovascular: "Positive for crushing chest pain, diaphoresis, palpitations. Denies claudication.",
      respiratory: "Positive for acute shortness of breath and orthopnea (2 pillows). Denies hemoptysis or chronic productive cough.",
      gastrointestinal: "Positive for nausea. Denies vomiting, hematemesis, or melena.",
      neurological: "Positive for dizziness and mild presyncope. Denies focal neurological deficit or loss of consciousness.",
      musculoskeletal: "Denies joint swelling, erythema, or localized skeletal tenderness on chest wall palpation.",
      genitourinary: "Normal micturition, denies dysuria or gross hematuria.",
      endocrine: "Known diabetic with polyuria history, currently on oral hypoglycemics.",
      integumentary: "Cool, clammy, diaphoretic skin with pale conjunctiva."
    }
  },
  {
    session_id: "sess_102",
    chief_complaint: "Bilateral knee, wrist, and small MCP joint pain with severe morning stiffness lasting > 90 minutes, abdominal distension, and sluggish digestion for 4 months",
    duration: "4 months (Progressive chronic)",
    hpi: {
      onset: "Insidious onset 4 months ago, initially involving wrists and proximal interphalangeal joints, later spreading to knees.",
      character: "Dull aching throbbing pain with persistent stiffness (Stabdhata) and burning warmth (Vidaha) during flare-ups.",
      radiation: "Ascending joint involvement with migratory stiffness (Sanchari Vedana).",
      aggravating_relieving: "Markedly aggravated in early mornings, damp humid cloudy weather, and after cold/heavy milk products. Relieved transiently by hot dry fomentation (Valuka Sweda) and warm ginger decoction.",
      associated_symptoms: "Severe anorexia (Aruchi), taste perversion, heavy coated tongue (Sama Jihva), lethargy, and irregular bowel evacuation."
    },
    past_medical: {
      chronic_illnesses: ["Primary Hypothyroidism (diagnosed 3 years ago)", "Chronic recurring dyspepsia (Agnimandya)"],
      past_surgeries: ["None"],
      prior_hospitalizations: ["None"]
    },
    drug_allergies: {
      known_allergies: [
        { allergen: "Sulphonamides (Sulpha drugs)", reaction: "Maculopapular drug eruption and pruritus", severity: "Moderate" }
      ],
      current_medications: [
        { name: "Tab Thyronorm", dosage: "50 mcg", frequency: "OD (Empty stomach morning)", indication: "Hypothyroidism" },
        { name: "Tab Paracetamol", dosage: "650 mg", frequency: "SOS (as needed for joint pain)", indication: "Analgesic" }
      ]
    },
    family_history: {
      cardiovascular: "No premature CAD.",
      metabolic: "Mother had chronic inflammatory joint disease (Amavata).",
      siblings: "Sister has autoimmune thyroiditis."
    },
    ros: {
      cardiovascular: "Normal heart sounds, no chest discomfort or palpitations.",
      respiratory: "Normal vesicular breath sounds, no cough or wheeze.",
      gastrointestinal: "Positive for Agnimandya, severe heaviness after small meals (Gaurava), constipation with hard scybalous stools.",
      neurological: "Unrefreshing sleep, mild tension headache on days with severe indigestion.",
      musculoskeletal: "Bilateral symmetrical joint swelling of MCP, PIP joints and knee joints with crepitus and restricted terminal flexion.",
      genitourinary: "Normal urine output, yellowish coloration (Pita Varna) on days with high Pitta.",
      endocrine: "Hypothyroidism stable on levothyroxine.",
      integumentary: "Dry skin (Rukshata), thick white coating on tongue dorsum."
    }
  },
  {
    session_id: "sess_103",
    chief_complaint: "Acute wheezing, dry paroxysmal cough, and chest tightness exacerbated by dust exposure for 2 days",
    duration: "2 days (Acute on chronic exacerbation)",
    hpi: {
      onset: "Began 48 hours ago following exposure to road construction dust and sudden temperature drop.",
      character: "Tight, suffocating sensation in the chest with loud expiratory wheeze.",
      radiation: "Non-radiating.",
      aggravating_relieving: "Worse at night between 2:00 AM - 4:00 AM and with cold liquids. Minimal response to home salbutamol inhaler.",
      associated_symptoms: "Watery rhinorrhea, paroxysmal sneezing, and inability to speak in full sentences."
    },
    past_medical: {
      chronic_illnesses: ["Bronchial Asthma (since age 9)", "Allergic Rhinitis"],
      past_surgeries: ["None"],
      prior_hospitalizations: ["Emergency room visit in 2023 for acute asthma exacerbation"]
    },
    drug_allergies: {
      known_allergies: [
        { allergen: "NSAIDs & Aspirin", reaction: "Bronchospasm & severe wheezing (Samter's Triad)", severity: "Critical" },
        { allergen: "Beta-Blockers (Propranolol)", reaction: "Acute bronchoconstriction", severity: "Critical" }
      ],
      current_medications: [
        { name: "Budesonide + Formoterol Inhaler", dosage: "200/6 mcg", frequency: "1 puff BD regularly", indication: "Asthma Maintenance" }
      ]
    },
    family_history: {
      cardiovascular: "No significant history.",
      metabolic: "None.",
      atopy: "Mother has allergic rhinitis and eczema."
    },
    ros: {
      cardiovascular: "Sinus tachycardia (112 bpm), no murmurs.",
      respiratory: "Diffuse bilateral polyphonic expiratory wheezes, prolonged expiratory phase, intercostal indrawing.",
      gastrointestinal: "Normal.",
      neurological: "Anxious, alert, oriented.",
      musculoskeletal: "Normal.",
      genitourinary: "Normal.",
      endocrine: "Normal.",
      integumentary: "Mild atopic dermatitis in antecubital fossa."
    }
  },
  {
    session_id: "sess_104",
    chief_complaint: "Bilateral knee pain during stair climbing and crepitus for 8 months",
    duration: "8 months (Gradual degenerative)",
    hpi: {
      onset: "Gradual onset related to weight-bearing activities.",
      character: "Grating pain (Sandhigata Vata), stiffening after prolonged sitting.",
      radiation: "Confined to knee joints.",
      aggravating_relieving: "Aggravated by squatting and prolonged standing. Relieved by warm sesame oil massage (Abhyanga).",
      associated_symptoms: "Mild morning stiffness < 20 minutes, joint cracking sounds."
    },
    past_medical: {
      chronic_illnesses: ["Mild Osteopenia", "Pre-hypertension"],
      past_surgeries: ["Bilateral tubal ligation (1998)"],
      prior_hospitalizations: ["None"]
    },
    drug_allergies: {
      known_allergies: [],
      current_medications: [
        { name: "Calcium + Vit D3", dosage: "500mg/250IU", frequency: "OD", indication: "Bone Health" }
      ]
    },
    family_history: {
      cardiovascular: "Hypertension in both parents.",
      metabolic: "None.",
      degenerative: "Mother had severe bilateral knee osteoarthritis."
    },
    ros: {
      cardiovascular: "Normal.",
      respiratory: "Normal.",
      gastrointestinal: "Regular bowel habits, occasional flatulence.",
      neurological: "Normal.",
      musculoskeletal: "Bilateral knee joint crepitus on passive range of motion, medial joint line tenderness.",
      genitourinary: "Normal.",
      endocrine: "Normal.",
      integumentary: "Dry skin, normal hair and nail texture."
    }
  }
];

export const ayush_history = [
  {
    session_id: "sess_102",
    prakriti: "Vata-Kapha (Deha Prakriti: Vata 45%, Kapha 40%, Pitta 15%)",
    vikriti: "Vata-Kapha Prakopa with Sama Vata dominant pathogenesis (Amavata)",
    agni: "Mandagni (Sluggish metabolic & digestive fire with impaired Dhatvagni)",
    koshtha: "Krura Koshtha (Hard, dry stools with tendency for Vibandha / constipation)",
    ahara_vihara: {
      dietary_habits: "Consumes cold milk with sour fruit smoothies, fermented batters, and curd at night (Viruddhahara / incompatibility).",
      timing_lifestyle: "Irregular meal timings (Adhyashana and Vishamashana), sedentary work with 2 hours daily day-sleeping (Divaswapna).",
      nidana_triggers: "Guru (heavy), Sheeta (cold), and Snigdha (unctuous) food items directly provoke Kapha and Ama formation in Amashaya.",
      sleep_pattern: "Disturbed sleep (Khandita Nidra) due to nocturnal joint pain and early morning stiffness.",
      stress_manas: "Moderate Rajasika mental state with mild somatic worry."
    },
    dashavidha_pariksha: {
      prakriti: "Vata-Kapha",
      vikriti: "Sama Vata with Pittanubandha (Acute flare of Amavata)",
      sara: "Madhyama Twak & Asthi Sara (Average tissue excellence)",
      samhanana: "Avara (Loose body compactness, poor joint tone)",
      pramana: "Madhyama (BMI 24.8 kg/m², proportional body frame)",
      satmya: "Madhyama Satmya (Accustomed to warm, cooked spicy foods; severely intolerant to cold & curd)",
      sattva: "Madhyama (Average mental resilience, cooperative with clinical recommendations)",
      ahara_shakti: {
        abhyavaharana: "Avara (Poor ingestion capacity, early satiety)",
        jarana: "Avara (Prolonged digestion > 6 hrs, sour eructations, heaviness)"
      },
      vyayama_shakti: "Avara (Poor physical endurance, fatigues easily with minimal exertion)",
      vaya: "Madhyama Vaya (46 years, Pitta dominant biological transition period)"
    },
    ashtavidha_pariksha: {
      nadi: "Vata-Kapha Gati (Manduk-Hamsa Gati, sluggish, deep)",
      mutra: "Pita-Shweta Varna, clear, no burning",
      mala: "Vibandha, Grathita (hard, pellet-like), Sama (foul-smelling, sinks in water)",
      jihva: "Sama Jihva (Thick yellowish-white coating, scalloped margins)",
      shabda: "Prakrita (Clear voice)",
      sparsha: "Sheeta (Cold extremities) with localized Ushna (Warmth) over inflamed joints",
      drik: "Prakrita, slightly pale conjunctiva",
      akriti: "Madhyama (Medium built)"
    },
    samprapti_ghataka: {
      dosha: "Vata (Vyana & Samana) and Kapha (Kledaka & Shleshaka)",
      dushya: "Rasa, Asthi, Majja, and Sandhi",
      srotas: "Rasavaha, Annavaha, Asthivaha Srotas",
      srotodushti: "Sanga (Obstruction) and Vimargagamana (Extravasation of Ama-Vata into joints)",
      udbhava_sthana: "Amashaya (Stomach)",
      sanchara_sthana: "Rasayani (Systemic circulation)",
      vyakta_sthana: "Kaphapurna Sandhi (Synovial joints)"
    }
  },
  {
    session_id: "sess_104",
    prakriti: "Vata-Pitta",
    vikriti: "Kevala Vata Vriddhi (Dhatukshaya-janya Sandhigata Vata)",
    agni: "Vishama Agni (Irregular digestive fire, fluctuating appetite)",
    koshtha: "Madhyama Koshtha",
    ahara_vihara: {
      dietary_habits: "Dry, cold snacks, minimal healthy unctuous foods (Sneha deficiency), low water intake.",
      timing_lifestyle: "Excessive stair climbing, prolonged sitting without adequate movement.",
      nidana_triggers: "Ruksha (dry), Laghu (light) diet with Vata-aggravating physical overuse.",
      sleep_pattern: "Normal 6-7 hours sleep.",
      stress_manas: "Sattvika with mild Vata anxiety."
    },
    dashavidha_pariksha: {
      prakriti: "Vata-Pitta",
      vikriti: "Vata dominant in Asthi-Sandhi",
      sara: "Avara Asthi Sara (Age-related bone mineral density reduction)",
      samhanana: "Madhyama",
      pramana: "Madhyama",
      satmya: "Pravara (Tolerates varied regional diets)",
      sattva: "Pravara (High mental resilience and positive outlook)",
      ahara_shakti: {
        abhyavaharana: "Madhyama",
        jarana: "Madhyama (Occasional postprandial gas)"
      },
      vyayama_shakti: "Madhyama (Walks 2 km daily, limited only by knee discomfort)",
      vaya: "Vriddha Vaya (61 years, Vata biological phase)"
    },
    ashtavidha_pariksha: {
      nadi: "Sarpa Gati (Vata dominant, fast, dry)",
      mutra: "Prakrita",
      mala: "Nirama, soft formed",
      jihva: "Nirama, mild pink with slight fissures",
      shabda: "Prakrita",
      sparsha: "Ruksha, mild roughness",
      drik: "Prakrita",
      akriti: "Madhyama-Krisha"
    },
    samprapti_ghataka: {
      dosha: "Vata (Vyana & Apana Vata)",
      dushya: "Asthi, Majja, Shleshaka Kapha (loss of synovial lubrication)",
      srotas: "Asthivaha Srotas",
      srotodushti: "Sanga and Atipravritti",
      udbhava_sthana: "Pakwashaya",
      sanchara_sthana: "Sarva Sharira",
      vyakta_sthana: "Janu Sandhi (Bilateral Knee Joints)"
    }
  }
];

export const medical_documents = [
  {
    document_id: "doc_rec_001",
    session_id: "sess_101",
    doc_type: "Emergency Lab & ECG Panel",
    title: "Stat Cardiac Biomarkers & 12-Lead ECG Strip",
    uploaded_at: "Today, 12:40 PM",
    file_size: "3.4 MB",
    extracted_conditions: [
      { condition: "Acute Coronary Syndrome (NSTEMI vs STEMI)", code: "ICD-10 I21.4", confidence: 0.98 },
      { condition: "Hypertensive Urgency", code: "ICD-10 I10", confidence: 0.95 },
      { condition: "Type 2 Diabetes with hyperglycemia", code: "ICD-10 E11.65", confidence: 0.96 }
    ],
    extracted_medications: [
      { name: "Telmisartan", dosage: "40 mg OD", status: "Active", adherence: "Regular" },
      { name: "Metformin", dosage: "500 mg BD", status: "Active", adherence: "Regular" },
      { name: "Atorvastatin", dosage: "20 mg HS", status: "Active", adherence: "Missed last 2 doses" }
    ],
    lab_values: [
      {
        test_name: "High-Sensitivity Troponin I",
        value: "485.2",
        unit: "pg/mL",
        reference_range: "0.0 - 19.8",
        is_abnormal: true,
        severity: "CRITICAL",
        trend: "Markedly Elevated (>24x upper limit)"
      },
      {
        test_name: "CK-MB",
        value: "44.0",
        unit: "U/L",
        reference_range: "0 - 24",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Elevated"
      },
      {
        test_name: "Random Blood Glucose",
        value: "198",
        unit: "mg/dL",
        reference_range: "70 - 140",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Elevated"
      },
      {
        test_name: "Serum Potassium (K+)",
        value: "4.2",
        unit: "mEq/L",
        reference_range: "3.5 - 5.1",
        is_abnormal: false,
        severity: "NORMAL",
        trend: "Normal"
      },
      {
        test_name: "Serum Creatinine",
        value: "1.12",
        unit: "mg/dL",
        reference_range: "0.70 - 1.30",
        is_abnormal: false,
        severity: "NORMAL",
        trend: "Normal"
      }
    ]
  },
  {
    document_id: "doc_rec_002",
    session_id: "sess_102",
    doc_type: "Autoimmune & Inflammatory Panel",
    title: "Rheumatology Lab Panel & Thyroid Profile",
    uploaded_at: "Yesterday, 04:15 PM",
    file_size: "2.1 MB",
    extracted_conditions: [
      { condition: "Amavata / Seropositive Inflammatory Arthritis", code: "ICD-10 M06.9 / NAM M01", confidence: 0.94 },
      { condition: "Agnimandya with Ama Lakshana", code: "NAM AG-02", confidence: 0.97 },
      { condition: "Primary Hypothyroidism", code: "ICD-10 E03.9", confidence: 0.99 }
    ],
    extracted_medications: [
      { name: "Levothyroxine (Thyronorm)", dosage: "50 mcg OD", status: "Active", adherence: "Regular" },
      { name: "Paracetamol", dosage: "650 mg SOS", status: "Intermittent", adherence: "On flare-ups" }
    ],
    lab_values: [
      {
        test_name: "Rheumatoid Factor (RF Quantitative)",
        value: "64.0",
        unit: "IU/mL",
        reference_range: "0.0 - 14.0",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Positive (>4.5x upper limit)"
      },
      {
        test_name: "Anti-CCP Antibodies",
        value: "82.5",
        unit: "U/mL",
        reference_range: "0.0 - 17.0",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Strongly Positive"
      },
      {
        test_name: "Erythrocyte Sedimentation Rate (ESR 1st hr)",
        value: "52",
        unit: "mm/hr",
        reference_range: "0 - 20",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Significantly Elevated"
      },
      {
        test_name: "C-Reactive Protein (hs-CRP)",
        value: "18.4",
        unit: "mg/L",
        reference_range: "0.0 - 5.0",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Elevated"
      },
      {
        test_name: "Thyroid Stimulating Hormone (TSH)",
        value: "4.85",
        unit: "mIU/L",
        reference_range: "0.40 - 4.50",
        is_abnormal: true,
        severity: "MODERATE",
        trend: "Borderline High"
      },
      {
        test_name: "Hemoglobin",
        value: "11.1",
        unit: "g/dL",
        reference_range: "12.0 - 15.5",
        is_abnormal: true,
        severity: "MILD",
        trend: "Mild Normocytic Anemia of Chronic Disease"
      }
    ]
  },
  {
    document_id: "doc_rec_003",
    session_id: "sess_103",
    doc_type: "Pulmonary Intake & CBC",
    title: "Spirometry Report & Complete Blood Count",
    uploaded_at: "Today, 11:20 AM",
    file_size: "1.8 MB",
    extracted_conditions: [
      { condition: "Acute Asthma Exacerbation", code: "ICD-10 J45.901", confidence: 0.99 },
      { condition: "Allergic Rhinitis with Atopic Diathesis", code: "ICD-10 J30.9", confidence: 0.95 }
    ],
    extracted_medications: [
      { name: "Budesonide + Formoterol Rotacaps", dosage: "200/6 mcg BD", status: "Active", adherence: "Regular" }
    ],
    lab_values: [
      {
        test_name: "Peak Expiratory Flow Rate (PEFR)",
        value: "220",
        unit: "L/min",
        reference_range: "450 - 650 (55% predicted)",
        is_abnormal: true,
        severity: "CRITICAL",
        trend: "Marked Airflow Limitation"
      },
      {
        test_name: "Absolute Eosinophil Count (AEC)",
        value: "840",
        unit: "cells/mcL",
        reference_range: "40 - 450",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Marked Peripheral Eosinophilia"
      },
      {
        test_name: "Serum IgE (Total)",
        value: "612",
        unit: "IU/mL",
        reference_range: "0 - 100",
        is_abnormal: true,
        severity: "HIGH",
        trend: "Significantly Elevated"
      }
    ]
  }
];

export const clinical_summaries = [
  {
    summary_id: "summ_101",
    session_id: "sess_101",
    status: "draft",
    physician_notes: "",
    last_modified_by: "AI Medical Intake Engine v2.4",
    generated_at: "Today, 12:41 PM",
    draft_text: `PATIENT CLINICAL INTAKE SYNTHESIS (EMERGENCY RED FLAG ALERT)
----------------------------------------------------------------------
Patient: Ramesh Kumar | 58M | MRN: AIIA-2026-9812 | Triage: Priority 1 Emergency
Chief Complaint: 45-minute history of acute, crushing retrosternal chest tightness radiating to the left arm and mandibular jaw with diaphoresis and dyspnea.

CRITICAL CLINICAL FINDINGS:
• High-Sensitivity Troponin I is severely elevated at 485.2 pg/mL (>24x upper reference limit of 19.8 pg/mL).
• Vitals demonstrate Hypertensive Urgency (BP 168/102 mmHg) and mild hypoxia (SpO2 91% on room air, RR 26/min).
• High pre-test probability for Acute Coronary Syndrome (NSTEMI / evolving STEMI).
• Significant cardiovascular risk factors: 8-year Hypertension, 6-year T2DM (RBS 198 mg/dL), Dyslipidemia, and positive premature paternal CAD death at age 52.

DRUG ALLERGY WARNING:
• Documented severe Penicillin allergy (angioedema/urticaria).
• Patient notes dyspepsia with plain Aspirin; use chewable/enteric-coated loading dose with gastroprotection.

RECOMMENDED IMMEDIATE CLINICAL ACTIONS:
1. Urgent 12-lead ECG review for ST-segment deviation or bundle branch block.
2. Stat high-flow O2 titration to achieve SpO2 > 94%.
3. Aspirin 300mg chewable + Clopidogrel 300mg/Ticagrelor 180mg loading dose (dual antiplatelet therapy).
4. Sublingual nitroglycerin (if systolic BP remains > 120 mmHg and no phosphodiesterase inhibitors).
5. Urgent cardiology consult and transfer to Cardiac Cath Lab / Coronary Care Unit.`
  },
  {
    session_id: "sess_102",
    status: "draft",
    physician_notes: "",
    last_modified_by: "AI Ayurvedic Intake Synthesis Engine v2.4",
    generated_at: "Yesterday, 04:30 PM",
    draft_text: `INTEGRATIVE AYUSH CLINICAL INTAKE SYNTHESIS (AMAVATA PROTOCOL)
----------------------------------------------------------------------
Patient: Sunita Devi | 46F | MRN: AIIA-2026-4431 | Mode: AYUSH OPD
Chief Complaint: 4-month history of bilateral symmetrical polyarticular pain (MCP, wrist, knee joints) with severe morning stiffness (>90 min), Gaurava (abdominal heaviness), and Mandagni.

AYURVEDIC ROOR DIAGNOSIS & SAMPRAPTI:
• Primary Diagnosis: Amavata (correlated with Seropositive Rheumatoid Arthritis, RF: 64 IU/mL, Anti-CCP: 82.5 U/mL, ESR: 52 mm/hr).
• Dosha Status: Vata-Kapha Prakopa with Sama Vata dominant involvement.
• Agni State: Severe Mandagni with Rasa-Dhatvagni Mandya generating circulating Ama.
• Koshtha: Krura Koshtha with Vibandha and Grathita Mala.
• Ahara-Vihara Nidana: Regular consumption of Viruddhahara (cold milk shakes, curd at night, heavy urad dal) with Divaswapna (day sleeping 2 hrs) directly obstructing Rasavaha and Sandhigata Srotas.

CHIKITSA SUTRA (RECOMMENDED TREATMENT STRATEGY):
1. Phase 1 - Deepana & Pachana (Ama Nirharana):
   - Shunthi + Guduchi Kwatha (30 ml BD before food).
   - Vaishwanara Churna / Hingwashtak Churna (3g with warm water before meals) to rekindle Jatharagni.
2. Swedana & Sthanika Upakrama:
   - Rooksha Sweda / Valuka Sweda (dry sand poultice) over affected swollen joints. Strictly avoid Snigdha Sweda or cold oil massage in acute Sama state.
3. Shodhana / Panchakarma Consideration:
   - Once Nirama Lakshana appears, plan Vaitarana Basti or Erand Sneha Virechana for systemic Vata-Ama elimination.
4. Pathya-Apathya Regimen:
   - Strict avoidance of Dadhi (curd), fermented foods, cold water, day sleep, and heavy bakery products. Encourage Yava (barley), Kulattha (horsegram soup), and warm spiced water.`
  },
  {
    session_id: "sess_103",
    status: "draft",
    physician_notes: "",
    last_modified_by: "AI Medical Intake Engine v2.4",
    generated_at: "Today, 11:30 AM",
    draft_text: `PATIENT CLINICAL INTAKE SYNTHESIS (PULMONOLOGY URGENT ALERT)
----------------------------------------------------------------------
Patient: Arjun Patel | 32M | MRN: AIIA-2026-7789 | Triage: Urgent
Chief Complaint: 2-day acute asthma exacerbation with expiratory wheezing and tachypnea, refractory to home inhaler therapy.

CRITICAL HIGHLIGHTS:
• Airflow obstruction: PEFR markedly reduced to 220 L/min (55% of predicted).
• SpO2 93% on ambient room air with respiratory rate of 28/min and intercostal retractions.
• Severe peripheral eosinophilia (AEC: 840 cells/mcL) and elevated total IgE (612 IU/mL).

CRITICAL DRUG ALLERGY WARNING:
• Severe allergic bronchospasm to Aspirin & NSAIDs (Samter's Triad). Avoid all non-steroidal anti-inflammatory agents.
• Absolute contraindication for non-selective Beta-blockers.

RECOMMENDED IMMEDIATE CLINICAL ACTIONS:
1. Continuous supplemental oxygen via nasal cannula targeting SpO2 94-98%.
2. Back-to-back nebulization with Salbutamol (2.5mg) + Ipratropium Bromide (500mcg).
3. Systemic corticosteroid: Oral Prednisolone 40-50mg stat or IV Hydrocortisone 100mg.
4. Re-evaluate PEFR 30 minutes post-nebulization.`
  },
  {
    session_id: "sess_104",
    status: "draft",
    physician_notes: "",
    last_modified_by: "AI Ayurvedic Intake Synthesis Engine v2.4",
    generated_at: "Today, 01:10 PM",
    draft_text: `INTEGRATIVE AYUSH CLINICAL INTAKE SYNTHESIS (SANDHIVATA PROTOCOL)
----------------------------------------------------------------------
Patient: Meera Nambiar | 61F | MRN: AIIA-2026-2104 | Mode: AYUSH OPD
Chief Complaint: 8-month history of bilateral knee pain during stair climbing with joint crepitus (Sandhigata Vata).

AYURVEDIC ROOT DIAGNOSIS:
• Primary Diagnosis: Janu Sandhigata Vata (Osteoarthritis of Knees due to Dhatukshaya).
• Dosha: Kevala Vata Vriddhi without Ama (Nirama stage).
• Dhatukshaya: Asthi & Majja Dhatu Kshaya, depletion of Shleshaka Kapha.

RECOMMENDED TREATMENT STRATEGY:
1. Sthanika Snehana & Swedana: Janu Basti with Ksheerabala Taila / Mahanarayana Taila followed by Nadi Sweda.
2. Shamana Aushadhi: Yogaraja Guggulu (2 tabs BD with warm water) + Lakshadi Guggulu.
3. Pathya: Warm, mildly unctuous foods with Ghee, milk with Ashwagandha at bedtime, avoid cold dry foods.`
  }
];
