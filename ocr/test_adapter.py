import io
import json
import os
import sys
from pathlib import Path

# Ensure ocr/ is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from services.hybrid_ocr import (
    process_hybrid_ocr,
    process_prescription,
    _normalize_input_to_bytes,
    ClinicalSummary
)

SAMPLE_PATH = "samples/sample-prescription.png"

def test_adapter_polymorphism():
    print("\n--- [TEST 1] Testing Universal Input Normalization ---")
    with open(SAMPLE_PATH, "rb") as f:
        expected_bytes = f.read()

    # 1. str path
    b_path = _normalize_input_to_bytes(SAMPLE_PATH)
    assert b_path == expected_bytes, "Path normalization failed"
    print("[OK] Path (str) normalization: SUCCESS (matches expected bytes)")

    # 2. Pathlib Path
    b_pobj = _normalize_input_to_bytes(Path(SAMPLE_PATH))
    assert b_pobj == expected_bytes, "Path object normalization failed"
    print("[OK] Path (Pathlib) normalization: SUCCESS")

    # 3. raw bytes
    b_raw = _normalize_input_to_bytes(expected_bytes)
    assert b_raw == expected_bytes, "Raw bytes pass-through failed"
    print("[OK] Raw bytes pass-through: SUCCESS")

    # 4. BytesIO
    b_io = _normalize_input_to_bytes(io.BytesIO(expected_bytes))
    assert b_io == expected_bytes, "BytesIO normalization failed"
    print("[OK] BytesIO file-like normalization: SUCCESS")

    # 5. Invalid input
    try:
        _normalize_input_to_bytes(12345)
        assert False, "Should raise ValueError for invalid input"
    except ValueError:
        print("[OK] Invalid type handling: SUCCESS (rejected cleanly)")

def test_file_path_pipeline():
    print("\n--- [TEST 2] Testing Direct Python Invocation (File Path) ---")
    summary = process_prescription(SAMPLE_PATH)
    assert isinstance(summary, ClinicalSummary)
    assert summary.status == "PROCESSED"
    assert len(summary.medications) >= 3
    print(f"[OK] Direct invocation process_prescription('{SAMPLE_PATH}') returned {len(summary.medications)} medications.")
    for med in summary.medications:
        print(f"  - {med.drug_name}: {med.frequency} | {med.instructions} | DB: {med.verification_status}")

def test_fastapi_endpoint_with_uploadfile():
    print("\n--- [TEST 3] Testing FastAPI HTTP Controller POST /ocr/process-hybrid ---")
    client = TestClient(app)
    
    # 1. Health check
    health_res = client.get("/health")
    assert health_res.status_code == 200
    print(f"[OK] Health Check passed: {health_res.json()}")

    # 2. Empty payload 400 test
    bad_res = client.post("/ocr/process-hybrid", files={"file": ("empty.png", b"", "image/png")})
    assert bad_res.status_code == 400
    print(f"[OK] Error handling validated (0-byte file returned HTTP 400: {bad_res.json()['detail']})")

    # 3. Valid UploadFile multipart payload
    with open(SAMPLE_PATH, "rb") as f:
        file_bytes = f.read()
    
    response = client.post(
        "/ocr/process-hybrid",
        files={"file": ("sample-prescription.png", file_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PROCESSED"
    assert len(data["medications"]) >= 3
    print(f"[OK] POST /ocr/process-hybrid passed: {len(data['medications'])} medications extracted via FastAPI UploadFile.")
    print("\nSample Response from HTTP endpoint:")
    print(json.dumps(data["medications"], indent=2))

if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING UNIVERSAL ADAPTER & BACKEND INTEGRATION VERIFICATION")
    print("=" * 60)
    
    # Run tests
    test_adapter_polymorphism()
    test_file_path_pipeline()
    test_fastapi_endpoint_with_uploadfile()

    print("\n" + "=" * 60)
    print("ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
