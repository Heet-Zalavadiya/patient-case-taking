from services.hybrid_ocr import process_hybrid_ocr

image_path = "samples/sample-prescription.png"

print("Processing prescription through Hybrid OCR (Azure Document Intelligence + Gemini-3.6-flash)...")

with open(image_path, "rb") as f:
    image_bytes = f.read()

result = process_hybrid_ocr(image_bytes)

print()
print("=" * 60)
print("HYBRID VISION OCR RESULT")
print("=" * 60)
print(f"Status               : {result.status}")
print(f"OCR Confidence Score : {result.ocr_confidence_score}%")
print(f"Doctor Name          : {result.doctor_name}")
print(f"Patient Name         : {result.patient_name}")
print(f"Prescription Date    : {result.date}")
print(f"Diagnoses / Symptoms : {', '.join(result.diagnosis_or_symptoms)}")
print("-" * 60)
print("MEDICATIONS EXTRACTED & DB VERIFIED:")
for idx, med in enumerate(result.medications, 1):
    print(f"  {idx}. Drug: {med.drug_name} (Standardized: {med.standardized_drug_name})")
    print(f"     Dose: {med.dosage} | Freq: {med.frequency} | Inst: {med.instructions}")
    print(f"     DB Verification: {med.verification_status} (Score: {med.verification_score}%)")
print("=" * 60)
