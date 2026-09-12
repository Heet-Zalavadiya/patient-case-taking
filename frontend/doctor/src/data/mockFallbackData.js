/**
 * MediKiosk Clinical Mock Fallback Datasets
 * Aligned with SIH26047 specifications & ABDM / FHIR / NAMASTE standards.
 * Provides guaranteed offline/resilient fallback data for:
 * - patients (demographics, triage status)
 * - structured_history (chief complaint, HPI symptoms, past history, ROS)
 * - red_flag_alerts (HIGH severity emergency flags, timestamps, vitals)
 * - document_extracted_lab_values (tabular lab investigations with is_abnormal: 1)
 * - clinical_summaries (AI draft consultations)
 */

export const mockPatients = [
  {
    patient_id: "pat_001",
    full_name: "Ramesh Kumar",
    age: 58,
    gender: "Male",
    mrn: "AIIA-2026-9812",
    token: "EM-101",
    queue_number: "Q-01",
    check_in_time: "10:30 AM",
    status: "waiting",
    blood_group: "B+",
    phone: "+91 98112 34567",
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
    full_name: "Sunita Devi",
    age: 46,
    gender: "Female",
    mrn: "AIIA-2026-4431",
    token: "AY-202",
    queue_number: "Q-02",
    check_in_time: "10:42 AM",
    status: "waiting",
    blood_group: "O+",
    phone: "+91 98450 87123",
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
    full_name: "Arjun Patel",
    age: 32,
    gender: "Male",
    mrn: "AIIA-2026-7789",
    token: "UR-303",
    queue_number: "Q-03",
    check_in_time: "10:55 AM",
    status: "in_consultation",
    blood_group: "A+",
    phone: "+91 97234 11980",
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
    full_name: "Meera Nambiar",
    age: 61,
    gender: "Female",
    mrn: "AIIA-2026-2104",
    token: "ST-404",
    queue_number: "Q-04",
    check_in_time: "11:05 AM",
    status: "waiting",
    blood_group: "AB+",
    phone: "+91 94471 66231",
    vitals_summary: {
      bp: "130/84 mmHg",
      pulse: "76 bpm",
      spo2: "97%",
      temp: "98.2 °F",
      rr: "17 /min"
    },
    triage_category: "Standard OPD"
  },
  {
    patient_id: "pat_005",
    full_name: "Harish Chandra Joshi",
    age: 52,
    gender: "Male",
    mrn: "AIIA-2026-8921",
    token: "AY-505",
    queue_number: "Q-05",
    check_in_time: "11:15 AM",
    status: "completed",
    blood_group: "O-",
    phone: "+91 98201 55432",
    vitals_summary: {
      bp: "128/82 mmHg",
      pulse: "78 bpm",
      spo2: "98%",
      temp: "98.6 °F",
      rr: "16 /min"
    },
    triage_category: "Follow-up Routine"
  }
];

export const mockStructuredHistories = {
  pat_001: {
    patient_id: "pat_001",
    chief_complaint: "Acute retrosternal crushing chest pain radiating to left jaw and shoulder with shortness of breath",
    hpi_associated_symptoms: [
      "Profuse cold diaphoresis",
      "Severe nausea and retching",
      "Dyspnea on minimal movement",
      "Lightheadedness / presyncope"
    ],
    hpi_onset: "Sudden onset ~45 minutes prior to triage while seated at rest",
    hpi_progression: "Rapidly escalating pressure sensation, 8/10 numerical pain severity, unrelieved by rest",
    hpi_aggravating_factors: ["Physical exertion", "Deep inspiration", "Supine posture"],
    hpi_relieving_factors: ["Sitting forward slightly (minimal)"],
    past_medical_history: [
      "Essential Hypertension (10 years, on Telmisartan 40mg)",
      "Type 2 Diabetes Mellitus (6 years, HbA1c 7.4%)",
      "Dyslipidemia (4 years, on Atorvastatin 20mg irregular)"
    ],
    allergies: [
      { allergen: "Penicillin", reaction: "Urticarial rash & angioedema", severity: "HIGH" },
      { allergen: "Aspirin (suspected)", reaction: "Mild epigastric burning", severity: "LOW" }
    ],
    current_medications: [
      { name: "Tab Telmisartan", dosage: "40mg OD (Morning)", adherence: "Regular" },
      { name: "Tab Metformin", dosage: "500mg BD (Post meals)", adherence: "Regular" },
      { name: "Tab Atorvastatin", dosage: "20mg HS", adherence: "Irregular" }
    ],
    review_of_systems: {
      Cardiovascular: "Crushing retrosternal chest pain, palpitations, diaphoresis; no witnessed syncope",
      Respiratory: "Acute tachypnea, orthopnea, no productive cough or wheezing",
      Gastrointestinal: "Severe nausea without vomiting, epigastric discomfort",
      Neurological: "Mild lightheadedness; alert, attentive, and oriented x 3",
      Musculoskeletal: "No trauma, no prior musculoskeletal thoracic tenderness"
    },
    dominant_dosha: "Pitta-Vata Aggravation"
  },
  pat_002: {
    patient_id: "pat_002",
    chief_complaint: "Chronic bilateral knee joint pain (Sandhivata), morning stiffness, and acid peptic burning",
    hpi_associated_symptoms: [
      "Crepitus on weight-bearing",
      "Morning joint stiffness > 35 minutes",
      "Sour belching (Amlodgara)",
      "Throat burning after oily food"
    ],
    hpi_onset: "Gradual onset over 8 months, progressively worsening over the past 3 weeks",
    hpi_progression: "Worse when climbing stairs and during cold weather; stiffness eases with mild walking",
    hpi_aggravating_factors: ["Cold damp weather", "Stair climbing", "Fermented and sour foods"],
    hpi_relieving_factors: ["Warm fomentation (Svedana)", "Sesame oil massage", "Resting in warm room"],
    past_medical_history: [
      "Bilateral Knee Osteoarthritis (Grade II Kellegren-Lawrence)",
      "Recurrent Gastroesophageal Reflux (Amlapitta)"
    ],
    allergies: [
      { allergen: "Sulfa Antibiotics", reaction: "Erythematous skin rash", severity: "MEDIUM" }
    ],
    current_medications: [
      { name: "Yograj Guggulu", dosage: "2 tabs BD after meals", adherence: "Regular" },
      { name: "Shallaki Capsules", dosage: "1 cap BD", adherence: "Regular" }
    ],
    review_of_systems: {
      Musculoskeletal: "Bilateral knee swelling, crepitus, reduced range of flexion",
      Gastrointestinal: "Postprandial sour belching, mild constipation",
      Cardiovascular: "No chest discomfort, no palpitations",
      Respiratory: "Clear lung fields, no breathlessness",
      Neurological: "Intact sensations, normal motor strength in upper limbs"
    },
    dominant_dosha: "Vata-Kapha with Pitta Anubandha"
  },
  pat_003: {
    patient_id: "pat_003",
    chief_complaint: "Acute wheezing, dry spasmodic cough, and respiratory tightness after dust exposure",
    hpi_associated_symptoms: [
      "Audible expiratory wheeze",
      "Paroxysmal nocturnal cough",
      "Difficulty completing full sentences",
      "Nasal congestion & sneezing"
    ],
    hpi_onset: "Acute onset 3 hours ago following construction site dust exposure",
    hpi_progression: "Rapid worsening with SpO2 dropping to 93% on ambient air",
    hpi_aggravating_factors: ["Dust, pollen, and cold draft", "Lying flat"],
    hpi_relieving_factors: ["Warm water sips", "Sitting leaning forward"],
    past_medical_history: [
      "Bronchial Asthma (Tamaka Shwasa) since childhood",
      "Allergic Rhinitis"
    ],
    allergies: [
      { allergen: "House Dust Mites & Pollen", reaction: "Bronchospasm & sneezing", severity: "HIGH" },
      { allergen: "NSAIDs (Ibuprofen)", reaction: "Bronchospasm trigger", severity: "HIGH" }
    ],
    current_medications: [
      { name: "Budesonide + Formoterol Inhaler", dosage: "200/6 mcg 2 puffs PRN", adherence: "Intermittent" }
    ],
    review_of_systems: {
      Respiratory: "Bilateral polyphonic expiratory wheezes, tachypnea (RR 28/min)",
      Cardiovascular: "Sinus tachycardia (HR 112 bpm), no murmur",
      ENT: "Pale edematous nasal turbinates, clear rhinorrhea",
      Gastrointestinal: "Normal appetite, no abdominal pain"
    },
    dominant_dosha: "Vata-Kapha (Pranavaha Srotas Dusthi)"
  },
  pat_004: {
    patient_id: "pat_004",
    chief_complaint: "Persistent burning epigastric pain, postprandial fullness, and nocturnal sour water brash",
    hpi_associated_symptoms: [
      "Retrosternal heartburn (Hritkantha Daha)",
      "Sour regurgitation while sleeping",
      "Nausea without vomiting",
      "Loss of appetite (Aruchi)"
    ],
    hpi_onset: "Intermittent for 6 months, severe for the past 2 weeks",
    hpi_progression: "Exacerbated after spicy evening snacks and late dinners",
    hpi_aggravating_factors: ["Spicy foods", "Chili", "Tea on empty stomach", "Sleeping flat"],
    hpi_relieving_factors: ["Cold milk", "Elevating head of bed 30 degrees"],
    past_medical_history: [
      "Chronic Gastritis / GERD (Amlapitta)",
      "Mild Grade 1 Fatty Liver"
    ],
    allergies: [],
    current_medications: [
      { name: "Tab Pantoprazole", dosage: "40mg OD before breakfast", adherence: "Regular" },
      { name: "Kamadudha Ras", dosage: "1 tab BD", adherence: "Regular" }
    ],
    review_of_systems: {
      Gastrointestinal: "Epigastric tenderness on deep palpation, no guarding or rebound",
      Cardiovascular: "Normal heart sounds, BP 130/84 mmHg",
      Respiratory: "Normal vesicular breath sounds",
      Endocrine: "Non-diabetic, normal thyroid profile"
    },
    dominant_dosha: "Pitta-Vata (Tikshnagni)"
  },
  pat_005: {
    patient_id: "pat_005",
    chief_complaint: "Routine 3-month follow-up for Type 2 Diabetes and integrative hypertension management",
    hpi_associated_symptoms: [
      "Occasional mild daytime fatigue",
      "Mild nocturia (1-2 times per night)",
      "No numbness or tingling in feet",
      "No blurred vision"
    ],
    hpi_onset: "Under control; stable for past 3 months",
    hpi_progression: "Fasting glucose well-maintained on diet and yoga routine",
    hpi_aggravating_factors: ["High-glycemic processed carbohydrates"],
    hpi_relieving_factors: ["Daily 45-minute brisk walk & Pranayama"],
    past_medical_history: [
      "Type 2 Diabetes Mellitus (Madhumeha, 5 yrs)",
      "Mild Hypertension (controlled)"
    ],
    allergies: [],
    current_medications: [
      { name: "Tab Metformin", dosage: "500mg BD", adherence: "Excellent" },
      { name: "Nisha Amalaki Churna", dosage: "3g BD with warm water", adherence: "Excellent" }
    ],
    review_of_systems: {
      Endocrine: "Blood glucose logs stable, no hypoglycemic episodes",
      Cardiovascular: "BP 128/82 mmHg, no pedal edema",
      Ophthalmology: "Annual fundoscopy within normal limits",
      Podiatry: "Foot pulses intact, monofilament sensation 10/10 intact"
    },
    dominant_dosha: "Kapha-Pitta Balanced"
  }
};

export const mockRedFlagAlerts = [
  {
    alert_id: "alert_001",
    patient_id: "pat_001",
    session_id: "sess_101",
    flag_description: "CRITICAL CARDIOVASCULAR TRIAGE: Crushing retrosternal chest pain radiating to left arm + Blood Pressure 168/102 mmHg & SpO2 91%. Immediate ECG & CCU transfer recommended.",
    severity: "HIGH",
    timestamp: "10:32 AM",
    is_acknowledged: false,
    vital_triggers: [
      "BP: 168/102 mmHg (Stage 2 Hypertension)",
      "SpO2: 91% (Hypoxia threshold)",
      "HR: 108 bpm (Tachycardia)"
    ],
    action_protocol: "Perform immediate 12-lead ECG, establish IV access, administer sublingual nitrate if SBP > 100, page on-duty cardiologist."
  },
  {
    alert_id: "alert_003",
    patient_id: "pat_003",
    session_id: "sess_103",
    flag_description: "HIGH RESPIRATORY DISTRESS: Severe acute bronchospasm with SpO2 93% on ambient air and respiratory rate 28/min. Nebulization protocol indicated.",
    severity: "HIGH",
    timestamp: "10:57 AM",
    is_acknowledged: false,
    vital_triggers: [
      "SpO2: 93% (Borderline hypoxemia)",
      "RR: 28 /min (Marked tachypnea)",
      "HR: 112 bpm (Sinus tachycardia)"
    ],
    action_protocol: "Initiate Salbutamol + Ipratropium nebulization with O2 support; assess peak expiratory flow."
  }
];

export const mockExtractedLabValues = {
  pat_001: [
    {
      lab_id: "lab_001_1",
      patient_id: "pat_001",
      test_name: "High-Sensitivity Cardiac Troponin I (hs-cTnI)",
      value: "1.48",
      unit: "ng/mL",
      reference_range: "< 0.04",
      is_abnormal: 1,
      flag: "CRITICAL HIGH"
    },
    {
      lab_id: "lab_001_2",
      patient_id: "pat_001",
      test_name: "Creatine Kinase-MB (CK-MB)",
      value: "42.6",
      unit: "ng/mL",
      reference_range: "0.0 - 5.0",
      is_abnormal: 1,
      flag: "HIGH"
    },
    {
      lab_id: "lab_001_3",
      patient_id: "pat_001",
      test_name: "Fasting Blood Sugar (Glucose)",
      value: "192",
      unit: "mg/dL",
      reference_range: "70 - 100",
      is_abnormal: 1,
      flag: "HIGH"
    },
    {
      lab_id: "lab_001_4",
      patient_id: "pat_001",
      test_name: "Total Leukocyte Count (WBC)",
      value: "12,400",
      unit: "/cumm",
      reference_range: "4,000 - 11,000",
      is_abnormal: 1,
      flag: "ELEVATED"
    },
    {
      lab_id: "lab_001_5",
      patient_id: "pat_001",
      test_name: "Serum Creatinine",
      value: "1.12",
      unit: "mg/dL",
      reference_range: "0.7 - 1.3",
      is_abnormal: 0,
      flag: "NORMAL"
    },
    {
      lab_id: "lab_001_6",
      patient_id: "pat_001",
      test_name: "Serum Potassium (K+)",
      value: "4.3",
      unit: "mEq/L",
      reference_range: "3.5 - 5.1",
      is_abnormal: 0,
      flag: "NORMAL"
    },
    {
      lab_id: "lab_001_7",
      patient_id: "pat_001",
      test_name: "Serum Sodium (Na+)",
      value: "138",
      unit: "mEq/L",
      reference_range: "135 - 145",
      is_abnormal: 0,
      flag: "NORMAL"
    }
  ],
  pat_002: [
    {
      lab_id: "lab_002_1",
      patient_id: "pat_002",
      test_name: "Erythrocyte Sedimentation Rate (ESR)",
      value: "38",
      unit: "mm/1st hr",
      reference_range: "0 - 20",
      is_abnormal: 1,
      flag: "ELEVATED"
    },
    {
      lab_id: "lab_002_2",
      patient_id: "pat_002",
      test_name: "High-Sensitivity C-Reactive Protein (hs-CRP)",
      value: "6.8",
      unit: "mg/L",
      reference_range: "< 3.0",
      is_abnormal: 1,
      flag: "ELEVATED"
    },
    {
      lab_id: "lab_002_3",
      patient_id: "pat_002",
      test_name: "Serum Uric Acid",
      value: "5.4",
      unit: "mg/dL",
      reference_range: "2.4 - 6.0",
      is_abnormal: 0,
      flag: "NORMAL"
    },
    {
      lab_id: "lab_002_4",
      patient_id: "pat_002",
      test_name: "Rheumatoid Factor (RF Quantitative)",
      value: "11.2",
      unit: "IU/mL",
      reference_range: "< 14.0",
      is_abnormal: 0,
      flag: "NEGATIVE"
    },
    {
      lab_id: "lab_002_5",
      patient_id: "pat_002",
      test_name: "Vitamin D3 (25-OH Cholecalciferol)",
      value: "14.2",
      unit: "ng/mL",
      reference_range: "30.0 - 100.0",
      is_abnormal: 1,
      flag: "DEFICIENT"
    },
    {
      lab_id: "lab_002_6",
      patient_id: "pat_002",
      test_name: "Hemoglobin (Hb)",
      value: "12.4",
      unit: "g/dL",
      reference_range: "12.0 - 15.5",
      is_abnormal: 0,
      flag: "NORMAL"
    }
  ],
  pat_003: [
    {
      lab_id: "lab_003_1",
      patient_id: "pat_003",
      test_name: "Absolute Eosinophil Count (AEC)",
      value: "680",
      unit: "/cumm",
      reference_range: "40 - 440",
      is_abnormal: 1,
      flag: "HIGH"
    },
    {
      lab_id: "lab_003_2",
      patient_id: "pat_003",
      test_name: "Total Serum IgE",
      value: "420",
      unit: "IU/mL",
      reference_range: "< 100",
      is_abnormal: 1,
      flag: "HIGH"
    },
    {
      lab_id: "lab_003_3",
      patient_id: "pat_003",
      test_name: "Arterial Blood Gas (ABG) pO2",
      value: "71",
      unit: "mmHg",
      reference_range: "80 - 100",
      is_abnormal: 1,
      flag: "LOW"
    },
    {
      lab_id: "lab_003_4",
      patient_id: "pat_003",
      test_name: "Arterial Blood Gas (ABG) pH",
      value: "7.42",
      unit: "pH units",
      reference_range: "7.35 - 7.45",
      is_abnormal: 0,
      flag: "NORMAL"
    }
  ],
  pat_004: [
    {
      lab_id: "lab_004_1",
      patient_id: "pat_004",
      test_name: "Serum Lipase",
      value: "38",
      unit: "U/L",
      reference_range: "10 - 60",
      is_abnormal: 0,
      flag: "NORMAL"
    },
    {
      lab_id: "lab_004_2",
      patient_id: "pat_004",
      test_name: "Alanine Aminotransferase (ALT/SGPT)",
      value: "48",
      unit: "U/L",
      reference_range: "7 - 35",
      is_abnormal: 1,
      flag: "BORDERLINE HIGH"
    },
    {
      lab_id: "lab_004_3",
      patient_id: "pat_004",
      test_name: "Serum Bilirubin Total",
      value: "0.9",
      unit: "mg/dL",
      reference_range: "0.2 - 1.2",
      is_abnormal: 0,
      flag: "NORMAL"
    },
    {
      lab_id: "lab_004_4",
      patient_id: "pat_004",
      test_name: "Helicobacter pylori Stool Antigen",
      value: "Negative",
      unit: "-",
      reference_range: "Negative",
      is_abnormal: 0,
      flag: "NORMAL"
    }
  ],
  pat_005: [
    {
      lab_id: "lab_005_1",
      patient_id: "pat_005",
      test_name: "Glycated Hemoglobin (HbA1c)",
      value: "6.7",
      unit: "%",
      reference_range: "< 5.7",
      is_abnormal: 1,
      flag: "DIABETIC RANGE (FAIR CONTROL)"
    },
    {
      lab_id: "lab_005_2",
      patient_id: "pat_005",
      test_name: "Fasting Blood Sugar",
      value: "118",
      unit: "mg/dL",
      reference_range: "70 - 100",
      is_abnormal: 1,
      flag: "ELEVATED"
    },
    {
      lab_id: "lab_005_3",
      patient_id: "pat_005",
      test_name: "Postprandial Blood Sugar (PPBS)",
      value: "148",
      unit: "mg/dL",
      reference_range: "< 140",
      is_abnormal: 1,
      flag: "SLIGHTLY HIGH"
    },
    {
      lab_id: "lab_005_4",
      patient_id: "pat_005",
      test_name: "Urine Microalbumin/Creatinine Ratio",
      value: "18",
      unit: "mg/g",
      reference_range: "< 30",
      is_abnormal: 0,
      flag: "NORMAL"
    }
  ]
};

export const mockClinicalSummaries = {
  pat_001: {
    summary_id: "sum_001",
    patient_id: "pat_001",
    status: "draft", // 'draft' | 'accepted' | 'amended' | 'rejected'
    draft_text: `58-year-old male with long-standing hypertension and diabetes presenting with acute retrosternal crushing chest pain (8/10 severity) radiating to left upper extremity, accompanied by profuse cold diaphoresis, dyspnea, and nausea for 45 minutes.\n\nCRITICAL FINDINGS:\n- Blood Pressure: 168/102 mmHg (Stage 2 Hypertensive Emergency)\n- SpO2: 91% on room air\n- Cardiac Troponin I: 1.48 ng/mL (Significantly elevated)\n- High risk for Acute Coronary Syndrome (STEMI/NSTEMI)\n\nIMMEDIATE PLAN:\n1. Urgent 12-lead ECG confirmation & emergency cardiologist consult.\n2. Sublingual Nitroglycerin 0.4mg PRN if SBP > 100 mmHg.\n3. Aspirin 300mg + Clopidogrel 300mg loading dose per cardiology protocol.\n4. High-flow O2 via nasal cannula to maintain SpO2 > 95%.\n5. Transfer to Intensive Coronary Care Unit (ICCU).`,
    physician_notes: "",
    last_modified_by: "AI Clinical Synthesizer (Draft)"
  },
  pat_002: {
    summary_id: "sum_002",
    patient_id: "pat_002",
    status: "draft",
    draft_text: `46-year-old female presenting with chronic bilateral knee joint pain (Sandhivata), morning stiffness > 35 minutes, crepitus, and postprandial heartburn (Amlapitta).\n\nKEY OBSERVATIONS:\n- Dominant Prakriti: Vata-Kapha with Pitta anubandha.\n- Agni Status: Mandaagni leading to Ama accumulation in joint spaces.\n- ESR (38 mm/hr) and hs-CRP (6.8 mg/L) elevated, indicating active joint inflammatory state.\n- Vitamin D3 deficiency (14.2 ng/mL).\n\nAYUSH RECOMMENDATIONS:\n1. Janu Basti with Mahanarayana Taila & Dashamoola Kwatha Parisheka.\n2. Yograj Guggulu 2 tabs BD with warm ginger water after meals.\n3. Cholecalciferol 60,000 IU weekly for 8 weeks.\n4. Pathya: Avoid cold foods, curd at night, and raw cabbage. Follow warm soothing diet.`,
    physician_notes: "",
    last_modified_by: "AI Clinical Synthesizer (Draft)"
  },
  pat_003: {
    summary_id: "sum_003",
    patient_id: "pat_003",
    status: "draft",
    draft_text: `32-year-old male presenting with acute respiratory distress following construction dust inhalation. Audible bilateral polyphonic wheeze, RR 28/min, SpO2 93% on room air.\n\nEVALUATION:\n- High Eosinophil count (680 /cumm) and elevated IgE (420 IU/mL) confirming acute allergic airway flare (Tamaka Shwasa).\n- Arterial pO2 reduced at 71 mmHg.\n\nMANAGEMENT:\n1. Immediate nebulization with Salbutamol 2.5mg + Ipratropium 500mcg.\n2. IV Hydrocortisone 100mg stat if bronchospasm unyielding.\n3. Kantakari Avaleha 5g BD and Shwas Kuthar Ras 1 tab BD after stabilization.\n4. Strict allergen avoidance and N95 mask usage.`,
    physician_notes: "",
    last_modified_by: "AI Clinical Synthesizer (Draft)"
  },
  pat_004: {
    summary_id: "sum_004",
    patient_id: "pat_004",
    status: "draft",
    draft_text: `61-year-old female with recurrent burning epigastric discomfort, nocturnal acid regurgitation, and throat burning (Amlapitta / GERD).\n\nEVALUATION:\n- Tikshnagni manifestation with Pitta provocation.\n- Mild transaminitis (ALT 48 U/L), H. pylori stool test negative.\n\nMANAGEMENT:\n1. Avipattikar Churna 3g BD before meals with lukewarm water.\n2. Kamadudha Ras (Moti Yukta) 1 tab BD with cold milk after meals.\n3. Lifestyle: Head of bed elevation by 30 degrees, light dinner by 7:30 PM, complete avoidance of red chili and fried savories.`,
    physician_notes: "",
    last_modified_by: "AI Clinical Synthesizer (Draft)"
  },
  pat_005: {
    summary_id: "sum_005",
    patient_id: "pat_005",
    status: "accepted",
    draft_text: `52-year-old male on regular follow-up for Type 2 Diabetes Mellitus. Clinically asymptomatic, glucose control satisfactory (HbA1c 6.7%, Microalbumin negative).\n\nPLAN:\n1. Continue Metformin 500mg BD.\n2. Continue Nisha-Amalaki Churna 3g BD.\n3. Repeat HbA1c in 3 months; maintain routine dietary control and brisk daily walk.`,
    physician_notes: "Clinically stable. Foot sensation intact. Advised annual dilated retinal examination next month.",
    last_modified_by: "Dr. Anand Kulkarni (ACCEPTED)"
  }
};
