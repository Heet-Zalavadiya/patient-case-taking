from services.gemini_ocr import extract_text


image_path = "samples/sample-prescription.png"

text = extract_text(image_path)

print()
print("=" * 50)
print("OCR RESULT")
print("=" * 50)
print()

print(text)

print()
print("=" * 50)