import sys
import json
from services.document_router import process_medical_document

def main():
    image_path = "samples/sample-prescription.png"
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    
    print(f"Processing document: {image_path}")
    print("Running through Unified Medical Document Router...")

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
    except Exception as e:
        print(f"Error reading {image_path}: {e}")
        return

    # Dummy patient metadata to test PII scrubbing
    dummy_metadata = {
        "name": "Sachin Sansare"
    }

    result = process_medical_document(image_bytes, patient_metadata=dummy_metadata)

    print("\n============================================================")
    print("UNIFIED ROUTER RESULT")
    print("============================================================")
    print(f"Document Type : {result.get('document_type')}")
    print("-" * 60)
    print(json.dumps(result.get("data"), indent=2))
    print("============================================================")

if __name__ == "__main__":
    main()
