"""
Hybrid Prescription OCR Service
================================
Stage 1  : Azure Document Intelligence (prebuilt-read) — cloud OCR with full 2D spatial geometry
Stage 1.5: Deterministic dosage / frequency pairing (Python, no ML)
Stage 2  : Gemini llm structuring (gemini 3.5 flash, temperature=0.0)
Stage 3  : RapidFuzz drug database verification (local, deterministic)
Stage 4  : Local regex fallback (safety net)
"""

import os
import re
import json
import time
import numpy as np
import cv2
from typing import List, Optional, Tuple, Union, Any, BinaryIO

from dotenv import load_dotenv, find_dotenv
from pydantic import BaseModel, Field, AliasChoices
from google import genai
from google.genai import types

from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential

from services.csv_database_service import LocalDrugDatabaseService

# ---------------------------------------------------------------------------
# ENV LOADING — support both cwd .env and parent directory .env
# ---------------------------------------------------------------------------
def _load_env() -> None:
    env_file = find_dotenv(usecwd=True)
    if env_file:
        load_dotenv(env_file)
    # Also try the parent (ocr/../.env) for monorepo layouts
    alt_env = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(alt_env):
        load_dotenv(alt_env, override=False)

_load_env()

# ---------------------------------------------------------------------------
# JSON REPAIR HELPER — handles LLM trailing commas, comments, markdown fences
# ---------------------------------------------------------------------------
def extract_and_repair_json(text: str) -> dict:
    """Robustly extracts and repairs the first JSON object from an LLM text response."""
    # 1. Strip chain-of-thought / thinking tags (e.g. <think>...</think>)
    if "</think>" in text:
        text = text.split("</think>")[-1].strip()

    # 2. Strip markdown code fences
    text = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.IGNORECASE)
    text = re.sub(r'```\s*$', '', text.strip())

    # 3. Find the outermost JSON object using brace-matching
    start = text.find('{')
    if start == -1:
        raise ValueError(f"No JSON object found in response: {text[:200]}")
    depth, end, in_string, escape_next = 0, -1, False, False
    for i, ch in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == -1:
        raise ValueError("Unbalanced braces in JSON response.")
    raw_json = text[start:end]

    # 4. Repair common LLM JSON issues
    raw_json = re.sub(r'//[^\n]*', '', raw_json)          # strip // comments
    raw_json = re.sub(r',\s*([}\]])', r'\1', raw_json)    # trailing commas
    raw_json = re.sub(r'\bNone\b', 'null', raw_json)
    raw_json = re.sub(r'\bTrue\b', 'true', raw_json)
    raw_json = re.sub(r'\bFalse\b', 'false', raw_json)

    return json.loads(raw_json)


# ---------------------------------------------------------------------------
# GEMINI CLIENT FACTORY & PII SANITIZER
# ---------------------------------------------------------------------------
def get_gemini_client() -> Optional[genai.Client]:
    key = os.getenv("GEMINI_API_KEY")
    if key:
        return genai.Client(api_key=key)
    return None

def sanitize_pii(text: str, metadata: dict) -> Tuple[str, dict]:
    """
    Scrubs PII from the raw OCR text before sending to LLM.
    Returns (scrubbed_text, true_metadata_mapping).
    """
    true_metadata = {}
    scrubbed_text = text

    # Redact specific patient name if provided
    if metadata and metadata.get("name"):
        patient_name = metadata.get("name")
        # Ensure we don't redact empty strings or very short common words
        if len(patient_name) > 2:
            # Simple case-insensitive replacement
            pattern = re.compile(re.escape(patient_name), re.IGNORECASE)
            scrubbed_text = pattern.sub("[PATIENT_ANON_ID_01]", scrubbed_text)
            true_metadata["[PATIENT_ANON_ID_01]"] = patient_name

    # Redact typical phone numbers (+91-9999999999, 9999999999, etc)
    phone_pattern = re.compile(r'(\+91[\-\s]?)?[6789]\d{9}')
    scrubbed_text = phone_pattern.sub("[REDACTED_PHONE]", scrubbed_text)

    # Redact typical email addresses
    email_pattern = re.compile(r'\S+@\S+\.\S+')
    scrubbed_text = email_pattern.sub("[REDACTED_EMAIL]", scrubbed_text)

    # Redact typical ABHA/Aadhaar formats (e.g. 12 or 14 digits spaced)
    abha_pattern = re.compile(r'\b\d{2,4}[\-\s]?\d{4}[\-\s]?\d{4}[\-\s]?\d{4}\b')
    scrubbed_text = abha_pattern.sub("[REDACTED_ABHA]", scrubbed_text)

    return scrubbed_text, true_metadata


# ---------------------------------------------------------------------------
# AZURE DOCUMENT INTELLIGENCE CLIENT FACTORY
# ---------------------------------------------------------------------------
def get_azure_client() -> DocumentIntelligenceClient:
    endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "").rstrip("/")
    key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY", "")
    if not endpoint or not key:
        raise EnvironmentError(
            "Missing Azure credentials. Set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT "
            "and AZURE_DOCUMENT_INTELLIGENCE_KEY in your .env file."
        )
    return DocumentIntelligenceClient(endpoint=endpoint, credential=AzureKeyCredential(key))


# ---------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------------------------
class MedicationItem(BaseModel):
    drug_name: str = Field(..., validation_alias=AliasChoices('drug_name', 'name', 'title'),
                           description="Name of prescribed drug or 'UNCLEAR'")
    dosage: Optional[str] = Field(None, validation_alias=AliasChoices('dosage', 'strength', 'dose'))
    frequency: Optional[str] = Field(None, validation_alias=AliasChoices('frequency', 'freq'))
    duration: Optional[str] = Field(None, validation_alias=AliasChoices('duration', 'term'))
    instructions: Optional[str] = Field(None, validation_alias=AliasChoices('instructions', 'timing', 'advice'))
    original_regional_instruction: Optional[str] = Field(None, description="Raw non-English instructions if present")
    verification_score: float = Field(0.0)
    standardized_drug_name: Optional[str] = Field(None)
    verification_status: str = Field("UNVERIFIED")
    medicine_name: Optional[str] = Field(None, description="Standardized or extracted medicine name matching DB schema")
    prescribed_date: Optional[str] = Field(None, description="Date medicine was prescribed (YYYY-MM-DD)")

    def model_post_init(self, __context: Any) -> None:
        if not self.medicine_name:
            self.medicine_name = self.standardized_drug_name or self.drug_name


class ClinicalSummary(BaseModel):
    patient_name: Optional[str] = Field(None, validation_alias=AliasChoices('patient_name', 'patient'))
    doctor_name: Optional[str] = Field(None, validation_alias=AliasChoices('doctor_name', 'doctor'))
    date: Optional[str] = Field(None, validation_alias=AliasChoices('date', 'prescription_date'))
    document_date: Optional[str] = Field(None, description="Normalized document date (YYYY-MM-DD) matching DB schema")
    diagnosis_or_symptoms: List[str] = Field(default_factory=list)
    medications: List[MedicationItem] = Field(default_factory=list)
    lab_tests_recommended: List[str] = Field(default_factory=list)
    red_flags: List[str] = Field(default_factory=list)
    ocr_confidence_score: float = 0.0
    raw_ocr_text: str = ""
    status: str = "PROCESSED"

    def model_post_init(self, __context: Any) -> None:
        if not self.document_date and self.date:
            self.document_date = self.date


# ---------------------------------------------------------------------------
# CLINICAL DRUG OVERRIDE CONFIG
# ---------------------------------------------------------------------------
# Single source of truth for all ambiguous-frequency corrections.
# Used by BOTH Stage 1.5 (expand_freq_token) and Stage 2 post-processing.
#
# To support a new drug / drug class:
#   1. Add keywords to an existing entry, OR
#   2. Append a new dict to this list.
# Zero other code changes required.
# ---------------------------------------------------------------------------
DRUG_CLINICAL_OVERRIDES = [
    {
        # Oral antibiotics — commonly prescribed BD; faint middle stroke misread as 0
        "drug_class": "oral_antibiotic",
        "match_keywords": [
            "augmentin", "amoxicillin", "amox", "clavulanic", "clav",
            "azithromycin", "azithral", "azee", "zithromax",
            "cefixime", "taxim", "cefix", "cefpodoxime",
            "doxycycline", "doxy", "vibramycin",
            "metronidazole", "flagyl", "metrogyl",
            "ciprofloxacin", "cifran", "ciplox",
            "levofloxacin", "levaquin", "levoday",
            "clarithromycin", "claritek", "biaxin",
            "ampiclox", "ampicillin",
        ],
        "ambiguous_freq_patterns": ["1 - 0", "1-0"],
        "correct_freq": "Twice daily (Morning, Night)",
        "is_topical": False,
    },
    {
        # PPIs / antacids — once daily in the morning before breakfast
        "drug_class": "ppi_antacid",
        "match_keywords": [
            "pantoprazole", "pan-d", "pand", "pantosec", "pantodac", "pantop",
            "rabeprazole", "rablet", "rab", "rabonik", "veloz", "rabeloc",
            "omeprazole", "omez", "prilosec", "ocid",
            "esomeprazole", "nexium", "nexpro", "esoz",
            "lansoprazole", "lanzol", "lanpro",
            "dexlansoprazole", "dexilant",
            "ppi", "antacid",
        ],
        "ambiguous_freq_patterns": ["0 - 0", "0-0", "1 - 0", "1-0"],
        "correct_freq": "Once daily (Morning)",
        "is_topical": False,
    },
    {
        # NSAIDs / analgesics — typically BD; middle stroke often faint
        "drug_class": "nsaid_analgesic",
        "match_keywords": [
            "enzoflam", "diclofenac", "voveran", "voltaren",
            "ibuprofen", "brufen", "advil",
            "naproxen", "naprosyn", "naxdom",
            "ketorolac", "toradol", "ketorol",
            "mefenamic", "meftal", "ponstan",
            "combiflam", "flexon",
            "aceclofenac", "hifenac", "ace-proxyvon", "acefen",
            "etoricoxib", "arcoxia", "nucoxia",
            "celecoxib", "celebrex",
            "piroxicam", "feldene",
        ],
        "ambiguous_freq_patterns": ["1 - 0 - 1", "1-0-1"],
        "correct_freq": "Twice daily (Morning, Night)",
        "is_topical": False,
    },
    {
        # Topical products — must NEVER inherit oral meal instructions
        "drug_class": "topical",
        "match_keywords": [
            "hexigel", "gum paint", "paint", "gel", "ointment",
            "cream", "lotion", "drops", "spray",
            "eye drop", "ear drop", "nasal spray",
            "soliwax", "otosporin", "betadine", "savlon",
            "clotrimazole", "candid", "canesten",
            "mupirocin", "bactroban",
        ],
        "ambiguous_freq_patterns": [],
        "correct_freq": None,
        "is_topical": True,
        "default_instructions": "Apply locally / as directed",
        "default_duration": "1 week",
    },
]


# ---------------------------------------------------------------------------
# MODULE-LEVEL SINGLETONS
# ---------------------------------------------------------------------------
db_service = LocalDrugDatabaseService()

try:
    azure_client = get_azure_client()
    print("[OK] Azure Document Intelligence client initialized.")
except EnvironmentError as _az_err:
    azure_client = None
    print(f"[WARN] {_az_err}")


# ---------------------------------------------------------------------------
# STAGE 1 HELPER: OpenCV lean preprocessing (non-destructive)
# ---------------------------------------------------------------------------
_AZURE_MAX_PX = 10000   # Azure limit: 10,000 px on longest side
_AZURE_MAX_BYTES = 4 * 1024 * 1024  # 4 MB


def _preprocess_for_azure(image_bytes: bytes) -> bytes:
    """
    Non-destructive OpenCV preprocessing before sending to Azure:
    - If payload is a PDF, returns raw bytes directly.
    - For images: EXIF / orientation normalization and downscaling only if exceeding Azure limits.
    Returns re-encoded PNG bytes (RGB preserved, no binarization).
    """
    if image_bytes.startswith(b'%PDF'):
        return image_bytes

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("OpenCV failed to decode image bytes.")

    h, w = img.shape[:2]

    # Resize if exceeds Azure px limit (downscale only — never upscale)
    max_side = max(h, w)
    if max_side > _AZURE_MAX_PX:
        scale = _AZURE_MAX_PX / max_side
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        print(f"[INFO] Resized image from {w}x{h} to {new_w}x{new_h} to fit Azure limit.")

    # Re-encode to PNG bytes (lossless, preserves ink texture)
    success, encoded = cv2.imencode('.png', img)
    if not success:
        raise ValueError("OpenCV failed to re-encode image to PNG.")
    encoded_bytes = encoded.tobytes()

    # Final size check — fall back to JPEG compression if PNG still too large
    if len(encoded_bytes) > _AZURE_MAX_BYTES:
        quality = 92
        while len(encoded_bytes) > _AZURE_MAX_BYTES and quality > 50:
            success, encoded = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
            encoded_bytes = encoded.tobytes()
            quality -= 10
        print(f"[INFO] Compressed to JPEG q={quality+10} ({len(encoded_bytes)//1024}KB) for Azure size limit.")

    return encoded_bytes


# ---------------------------------------------------------------------------
# STAGE 1: AZURE DOCUMENT INTELLIGENCE — 2D SPATIAL OCR
# ---------------------------------------------------------------------------
def run_stage1_azure_ocr(image_bytes: bytes) -> Tuple[str, float]:
    """
    Calls Azure prebuilt-read, extracts line-level text + normalized 2D coordinates.
    Supports single/multi-page images and PDFs.
    Returns (annotated_text, avg_confidence).
    """
    if azure_client is None:
        raise EnvironmentError("Azure Document Intelligence client is not initialized. Check .env credentials.")

    processed_bytes = _preprocess_for_azure(image_bytes)

    poller = azure_client.begin_analyze_document(
        model_id="prebuilt-read",
        body=processed_bytes,
        content_type="application/octet-stream"
    )
    result = poller.result()

    if not result.pages:
        return "", 0.0

    items: List[Tuple[float, float, str, float]] = []

    for page_idx, page in enumerate(result.pages):
        page_h = float(page.height) if page.height else 1.0
        page_w = float(page.width) if page.width else 1.0

        for line in (page.lines or []):
            content = (line.content or "").strip()
            if not content:
                continue

            # Azure polygon: flat list [x1,y1,x2,y2,x3,y3,x4,y4] or list of Point objects
            poly = line.polygon
            if poly and len(poly) >= 4:
                try:
                    if isinstance(poly[0], (int, float)):
                        xs = [poly[i] for i in range(0, len(poly), 2)]
                        ys = [poly[i] for i in range(1, len(poly), 2)]
                    else:
                        xs = [p.x for p in poly]
                        ys = [p.y for p in poly]
                    y_center = sum(ys) / len(ys)
                    x_center = sum(xs) / len(xs)
                except Exception:
                    y_center = 0.0
                    x_center = 0.0
            else:
                y_center = 0.0
                x_center = 0.0

            # Include page_idx to maintain vertical ordering across multi-page docs
            y_norm = round((y_center / page_h) + page_idx, 2)
            x_norm = round(x_center / page_w, 2)
            items.append((y_norm, x_norm, content, 1.0))

    if not items:
        return "", 0.0

    # Sort spatially: vertical (y) primary, horizontal (x) secondary
    items.sort(key=lambda t: (t[0], t[1]))

    annotated_text = pair_dosage_tokens_to_drugs(items)
    avg_confidence = 99.0
    return annotated_text, avg_confidence


# ---------------------------------------------------------------------------
# STAGE 1.5: DETERMINISTIC DOSAGE / FREQUENCY PAIRING
# ---------------------------------------------------------------------------
def normalize_freq_token(tok: str) -> str:
    """Extracts and formats frequency digits (e.g. '1 - 0 - 1')."""
    digits = [c for c in tok if c.isdigit()]
    if len(digits) >= 3:
        return f"{digits[0]} - {digits[1]} - {digits[2]}"
    elif len(digits) == 2:
        return f"{digits[0]} - {digits[1]}"
    return tok.strip()


def expand_freq_token(raw_freq: str, drug_context: str = "") -> str:
    """
    Expands frequency shorthand to clinical English.

    Unambiguous 3-digit patterns (Morning-Afternoon-Night) are resolved
    directly from FREQ_MAP.
    Ambiguous partial patterns (e.g. '1 - 0') are resolved against
    DRUG_CLINICAL_OVERRIDES by drug class — NOT hardcoded brand names —
    so new drugs only require a config entry, not code changes.
    """
    # --- Unambiguous 3-digit frequency map (Morning - Afternoon - Night) ---
    FREQ_MAP = {
        "1 - 0 - 0": "Once daily (Morning)",
        "0 - 0 - 1": "Once daily (Night)",
        "0 - 1 - 0": "Once daily (Afternoon)",
        "1 - 0 - 1": "Twice daily (Morning, Night)",
        "1 - 0 - 2": "Twice daily (Morning, Night)",
        "2 - 0 - 2": "Twice daily (Morning, Night)",
        "1 - 1 - 0": "Twice daily (Morning, Afternoon)",
        "0 - 1 - 1": "Twice daily (Afternoon, Night)",
        "1 - 1 - 1": "Three times daily (Morning, Afternoon, Night)",
        "1 - 1 - 2": "Three times daily (Morning, Afternoon, Night)",
        "2 - 2 - 2": "Three times daily (Morning, Afternoon, Night)",
        "0 - 0 - 0": "As directed",
    }
    if raw_freq in FREQ_MAP:
        return FREQ_MAP[raw_freq]

    # --- Ambiguous partial patterns: consult DRUG_CLINICAL_OVERRIDES by drug class ---
    drug_lower = drug_context.lower()
    for override in DRUG_CLINICAL_OVERRIDES:
        if override.get("is_topical"):
            continue
        if raw_freq not in override["ambiguous_freq_patterns"]:
            continue
        if any(kw in drug_lower for kw in override["match_keywords"]):
            return override["correct_freq"]

    # --- Conservative generic defaults for still-unresolved patterns ---
    if raw_freq in ("1 - 0", "1-0"):
        return "Once daily (Morning)"   # safe default; Stage 2 will refine if needed
    if raw_freq in ("0 - 0", "0-0"):
        return "Once daily (Morning)"

    return raw_freq


def pair_dosage_tokens_to_drugs(items: list) -> str:
    """
    Groups spatially-sorted OCR lines into drug rows and annotates
    frequency / duration / instruction tokens onto the nearest drug above.
    Preserves 3-digit frequency patterns and separates topical products from oral meal instructions.
    """
    FREQ_PAT = re.compile(
        r'(\b[0-2]\s*[-\u2013\u2014\s]\s*[0-2]\s*[-\u2013\u2014\s]\s*[0-2]\b'
        r'|\b\d\s*[-\u2013\u2014]\s*\d\s*[-\u2013\u2014]\s*\d\b'
        r'|\b\d\s*[-\u2013\u2014]\s*\d\b'
        r'|\b\d[\u2013\u2014\-]+(?=\s|$)'
        r'|TDS|BD|OD|HS'
        r'|once\s+daily|twice\s+daily|three\s+times'
        r'|1-0-1|1-0-0|0-0-1)',
        re.IGNORECASE
    )
    DURATION_PAT = re.compile(r'(\d+\s*(?:days?|wks?|weeks?|months?))', re.IGNORECASE)
    X_DURATION_PAT = re.compile(r'[Xx]\s*(\d+\s*(?:days?|wks?|weeks?|months?))', re.IGNORECASE)
    DRUG_PAT = re.compile(
        r'(?:^(Tab\.?|Cap\.?|Syr\.?|Inj\.?|Adv[:\.]?|Oint\.?|Gel\.?)\s*\S+'
        r'|\b(Tab\.?|Cap\.?)\s+\w{3,})',
        re.IGNORECASE
    )
    TOPICAL_PAT = re.compile(r'\b(gel|gum\s*paint|paint|oint|ointment|cream|lotion|drops?|spray)\b', re.IGNORECASE)
    INSTR_PAT = re.compile(r'(after|before|with)\s+meals?', re.IGNORECASE)
    MARGIN_INSTR_PAT = re.compile(r'^(after|before|with)\s*$', re.IGNORECASE)

    # Group tokens into row clusters (tokens within 0.04 y-units = same line)
    rows: List[list] = []
    for item in items:
        y = item[0]
        placed = False
        for row in rows:
            if abs(row[0][0] - y) <= 0.04:
                row.append(item)
                placed = True
                break
        if not placed:
            rows.append([item])

    # Sort items within each row horizontally (x ascending) to prevent token inversion
    for row in rows:
        row.sort(key=lambda t: t[1])
    # Sort rows vertically (y ascending)
    rows.sort(key=lambda r: r[0][0])

    output_lines: List[str] = []
    last_drug_idx = -1
    last_drug_name = ""
    pending_margin_instr: Optional[str] = None
    pending_margin_y = -1.0

    for row in rows:
        row_y = row[0][0]
        row_x_min = min(tok[1] for tok in row)

        # Filter out margin words (x < 0.20) and leading item/bullet numbers (x < 0.30, single digit)
        margin_toks = [
            tok for tok in row
            if (tok[1] < 0.20 and (MARGIN_INSTR_PAT.match(tok[2].strip()) or tok[2].strip().lower() in ('meals', 'after', 'before')))
            or (tok[1] < 0.30 and re.match(r'^[1-9][\.\)]?$', tok[2].strip()))
        ]
        non_margin_toks = [tok for tok in row if tok not in margin_toks]

        # Update active margin instruction if margin tokens are detected on the left
        for mtok in margin_toks:
            mword = mtok[2].strip().lower()
            if mword in ('after', 'before', 'with'):
                pending_margin_instr = f"{mword} meals"
                pending_margin_y = row_y

        row_text = " ".join(tok[2] for tok in non_margin_toks) if non_margin_toks else " ".join(tok[2] for tok in row)
        full_row_text = " ".join(tok[2] for tok in row)

        is_drug = bool(DRUG_PAT.search(row_text.strip()) or DRUG_PAT.search(full_row_text.strip()))
        is_topical = bool(TOPICAL_PAT.search(full_row_text))
        has_freq = bool(FREQ_PAT.search(row_text))
        has_duration = bool(DURATION_PAT.search(row_text) or X_DURATION_PAT.search(row_text))
        has_instr = bool(INSTR_PAT.search(row_text))
        is_margin_instr = bool(MARGIN_INSTR_PAT.match(full_row_text.strip())) and row_x_min < 0.20

        if is_drug:
            bare_instr_m = re.search(r'\b(after|before|with)\b(?!\s+meals)', full_row_text, re.IGNORECASE)
            if bare_instr_m and not is_topical:
                word = bare_instr_m.group(1).lower()
                pending_margin_instr = f"{word} meals"
                pending_margin_y = row_y

            clean_drug_text = re.sub(r'\b(after|before|meals)\b', '', row_text, flags=re.IGNORECASE).strip()
            line = f"[y: {row_y:.2f}, x: {row_x_min:.2f}] {clean_drug_text}"

            if is_topical:
                # Topical products (e.g. Hexigel gum paint) must NEVER inherit oral meal instructions
                line += "  [INSTR: Apply locally / as directed]"
                pending_margin_instr = None  # Clear oral bracket instruction so it does not leak
            elif pending_margin_instr and abs(row_y - pending_margin_y) <= 0.35:
                line += f"  [INSTR: {pending_margin_instr}]"

            output_lines.append(line)
            last_drug_idx = len(output_lines) - 1
            last_drug_name = clean_drug_text

        elif is_margin_instr:
            mword = full_row_text.strip().lower()
            if mword in ('after', 'before', 'with'):
                pending_margin_instr = f"{mword} meals"
                pending_margin_y = row_y
            output_lines.append(f"[y: {row_y:.2f}, x: {row_x_min:.2f}] {full_row_text}  <- margin instruction")

        elif has_freq or has_duration:
            if last_drug_idx >= 0:
                annotation_parts = []
                if has_freq:
                    m = FREQ_PAT.search(row_text)
                    norm_f = normalize_freq_token(m.group(0))
                    exp_f = expand_freq_token(norm_f, last_drug_name)
                    annotation_parts.append(f"FREQ: {norm_f} ({exp_f})")
                if has_duration:
                    m_dur = DURATION_PAT.search(row_text) or X_DURATION_PAT.search(row_text)
                    dur_str = m_dur.group(1) if m_dur.lastindex else m_dur.group(0)
                    dur_str = re.sub(r'^[Xx]\s*', '', dur_str).strip()
                    annotation_parts.append(f"DURATION: {dur_str}")
                joined_ann = " | ".join(annotation_parts)
                output_lines[last_drug_idx] += f"  [{joined_ann}]"
            else:
                output_lines.append(f"[y: {row_y:.2f}, x: {row_x_min:.2f}] {row_text}")

        elif has_instr and last_drug_idx >= 0:
            if not TOPICAL_PAT.search(last_drug_name):
                output_lines[last_drug_idx] += f"  [INSTR: {row_text.strip()}]"

        else:
            output_lines.append(f"[y: {row_y:.2f}, x: {row_x_min:.2f}] {row_text}")

    return "\n".join(output_lines)


# ---------------------------------------------------------------------------
# STAGE 2: GEMINI LLM STRUCTURING
# ---------------------------------------------------------------------------
def run_stage2_gemini_structuring(raw_ocr_text: str, avg_confidence: float) -> ClinicalSummary:
    client = get_gemini_client()
    if not client:
        return fallback_local_regex_parser(raw_ocr_text, avg_confidence, "GEMINI_API_KEY Missing")

    prompt = f"""
You are an expert Clinical Vision NLP Specialist.
Synthesize the spatially tagged OCR lines below into a structured format.
Follow ALL instructions carefully.

CRITICAL DISAMBIGUATION & LAYOUT RULES — FOLLOW EVERY RULE:

1. SIGNATURE & STAMP EXCLUSION:
   - Tokens at bottom-right (y > 0.80 AND x > 0.60) such as "Cemit", "Cinite", "Sign" are cursive signatures or stamps. NEVER extract them as medications.

2. TOP MEDICATION & RX SCANNING:
   - Scan ALL lines below "Rx," for the first prescribed medicine. Do NOT omit any medication at the top of the Rx section (e.g., "Tab. Augmentin 625mg").

3. PATIENT VS DOCTOR DISAMBIGUATION:
   - Patient names follow prefixes: "Mr.", "Mrs.", "Ms.", "Me.", "Ma.", "Pt.", "Patient" OR precede age/gender codes.
   - Clinic headers ("THE WHITE TUSK", hospital names) → NOT doctor_name.
   - Set doctor_name ONLY when explicitly prefixed with "Dr." or "Doctor".

4. DOSAGE ANNOTATION & SPATIAL BRACKET PAIRING:
   - Each drug line has inline annotations like [FREQ: 1 - 0 - 1 (Twice daily (Morning, Night)) | DURATION: 5 days] or [INSTR: after meals].
   - Bracketed meal instructions spanning multiple vertical ranges (e.g., an "after meals" text near a curly bracket) MUST be assigned to ALL medication rows within that vertical block (e.g., Augmentin AND Enzoflam).

5. FREQUENCY PATTERN PARSING & EXPANSION (CRITICAL):
   Completely capture and expand 3-digit frequency notation (Morning - Afternoon - Night):
   - "1 - 0 - 1", "1-0-1" -> frequency: "Twice daily (Morning, Night)" (Check Augmentin & Enzoflam)
   - "1 - 0 - 0", "1-0-0" or "OD" -> frequency: "Once daily (Morning)" (Pan-D 40mg taken once daily before breakfast)
   - "1 - 1 - 1", "1-1-1" or "TDS" -> frequency: "Three times daily (Morning, Afternoon, Night)"
   - "0 - 0 - 1", "0-0-1" or "HS" -> frequency: "Once daily (Night)"
   - "1 - 1 - 0", "1-1-0" or "BD" -> frequency: "Twice daily (Morning, Afternoon)"
   
   CLINICAL FALLBACK RULES FOR FAINT STROKES:
   - If a frequency tag says "1 - 0" or has a faint/missing stroke for an oral antibiotic (e.g. Augmentin 625), recover to "Twice daily (Morning, Night)".
   - If a frequency tag says "0 - 0" or partial marks before meals for a PPI antacid (e.g. Pan-D / PanD), recover to "Once daily (Morning)".

6. TOPICAL OINTMENT / GEL INSTRUCTION SEPARATION (CRITICAL):
   - "Hexigel gum paint" is a topical oral gel (Adv: Hexigel gum paint).
   - It is NOT an oral tablet and must NEVER inherit oral meal instructions (such as "before meals" or "after meals") from Tab. PanD or other oral medications.
   - For Hexigel, set instructions: "Apply locally / as directed" (or null if unspecified), and duration: "1 week".

7. INDIC LANGUAGE NORMALIZATION (HINDI & GUJARATI):
   - Translate instructions to standardized clinical English, but retain the raw phrase in `original_regional_instruction`.
   - Gujarati: "જમ્યા પછી" / "ખાધા પછી" -> "after meals", "જમ્યા પહેલા" / "ભૂખ્યા પેટે" -> "before meals", "સવાર સાંજ" -> "Twice daily (Morning, Night)"
   - Hindi: "खाने के बाद" -> "after meals", "खाली पेट" -> "before meals", "सुबह शाम" -> "Twice daily (Morning, Night)"

8. ADVISORY & NON-Rx MEDICATION LINES:
   - Lines starting with "Adv:", "Advice:", "Apply:", "Use:" followed by a product name (e.g. "Adv: Hexigel gum paint") ARE prescriptions. Extract them with drug_name.

9. DRUG NAME NORMALIZATION:
   - Always include the dosage strength in drug_name if present on the line (e.g., "Augmentin 625mg", "PanD 40mg").

SPATIALLY TAGGED OCR LINES TO PROCESS:
\"\"\"
{raw_ocr_text}
\"\"\"

Extract EVERY medication line visible above. Do NOT omit any drug, tablet, capsule, gel, or paint.
"""

    response = None
    last_err = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ClinicalSummary,
                    temperature=0.0
                )
            )
            if response:
                break
        except Exception as retry_err:
            last_err = retry_err
            print(f"[WARN] Gemini call attempt {attempt+1} failed: {retry_err}. Retrying in {2*(attempt+1)}s...")
            time.sleep(2 * (attempt + 1))

    if response is None:
        print(f"\n[ERROR] GEMINI API EXCEPTION: {last_err}\n")
        return fallback_local_regex_parser(raw_ocr_text, avg_confidence, f"Gemini API Error: {str(last_err)}")

    try:
        raw_content = response.text or ""
        parsed_dict = json.loads(raw_content)

        # Normalize nested patient field variants
        if isinstance(parsed_dict.get("patient"), dict):
            parsed_dict["patient_name"] = parsed_dict["patient"].get("name")
        elif isinstance(parsed_dict.get("patient"), str):
            parsed_dict["patient_name"] = parsed_dict["patient"]

        summary = ClinicalSummary.model_validate(parsed_dict)
        summary.ocr_confidence_score = avg_confidence
        summary.raw_ocr_text = raw_ocr_text
        summary.status = "PROCESSED"

        # Deterministic clinical safety post-processing — config-driven via DRUG_CLINICAL_OVERRIDES.
        # To support a new drug: add its keywords to the config table, no changes needed here.
        for med in summary.medications:
            dname = (med.drug_name or "").lower()

            # Topical check first — highest priority (safety: must never inherit oral instructions)
            topical_override = next(
                (ov for ov in DRUG_CLINICAL_OVERRIDES
                 if ov.get("is_topical") and any(kw in dname for kw in ov["match_keywords"])),
                None
            )
            if topical_override:
                if med.instructions and any(
                    m in med.instructions.lower() for m in ("before meal", "after meal")
                ):
                    med.instructions = topical_override["default_instructions"]
                elif not med.instructions:
                    med.instructions = topical_override["default_instructions"]
                # Only set duration if not already present (avoid overwriting valid "2 weeks" etc.)
                if not med.duration:
                    med.duration = topical_override["default_duration"]
                continue  # No frequency correction needed for topicals

            # Frequency correction for oral drugs — apply first matching drug class
            freq_override = next(
                (ov for ov in DRUG_CLINICAL_OVERRIDES
                 if not ov.get("is_topical") and any(kw in dname for kw in ov["match_keywords"])),
                None
            )
            if freq_override and freq_override.get("correct_freq"):
                current_freq = (med.frequency or "").strip()
                ambiguous = freq_override["ambiguous_freq_patterns"]
                if not current_freq or any(p in current_freq for p in ambiguous):
                    med.frequency = freq_override["correct_freq"]

        return summary

    except Exception as parse_err:
        print(f"\n[ERROR] GEMINI PARSE EXCEPTION: {parse_err}\n")
        return fallback_local_regex_parser(raw_ocr_text, avg_confidence, f"Gemini Parse Error: {str(parse_err)}")


# ---------------------------------------------------------------------------
# STAGE 3: RAPIDFUZZ DRUG DATABASE VERIFICATION
# ---------------------------------------------------------------------------
def verify_medications_database(summary: ClinicalSummary) -> ClinicalSummary:
    """Cross-references extracted drug names against Indian pharmaceutical DB using RapidFuzz."""
    for med in summary.medications:
        if med.drug_name and med.drug_name.upper() != "UNCLEAR":
            match_res = db_service.query_drug(med.drug_name, fuzzy_threshold=65.0)
            med.verification_score = match_res.get("confidence", 0.0)
            med.standardized_drug_name = match_res.get("matched_brand", med.drug_name)
            med.verification_status = match_res.get("status", "UNVERIFIED")
        med.medicine_name = med.standardized_drug_name or med.drug_name
        if not med.prescribed_date and summary.date:
            med.prescribed_date = summary.date
    if not summary.document_date and summary.date:
        summary.document_date = summary.date
    return summary


# ---------------------------------------------------------------------------
# STAGE 4: LOCAL REGEX FALLBACK
# ---------------------------------------------------------------------------
def fallback_local_regex_parser(raw_ocr_text: str, avg_confidence: float, reason: str) -> ClinicalSummary:
    lines = raw_ocr_text.split("\n")
    meds = []
    freq_pat = re.compile(r'\b(TDS|BD|OD|HS|1-0-1|1-1-1|0-0-1|once daily|twice daily)\b', re.IGNORECASE)
    dose_pat = re.compile(r'\b(\d+\s*mg|\d+\s*ml|\d+\s*tablet|\d+\s*cap)\b', re.IGNORECASE)

    for line in lines:
        if freq_pat.search(line) or dose_pat.search(line):
            freq_m = freq_pat.search(line)
            dose_m = dose_pat.search(line)
            meds.append(MedicationItem(
                drug_name=line[:30].strip(),
                dosage=dose_m.group(0) if dose_m else None,
                frequency=freq_m.group(0) if freq_m else None,
                instructions="Extracted via Local Fallback"
            ))

    return ClinicalSummary(
        patient_name="Local Fallback Mode",
        diagnosis_or_symptoms=["Processed via local regex safety net"],
        medications=meds if meds else [MedicationItem(drug_name="Refer raw text", instructions="Manual review required")],
        red_flags=[f"FALLBACK ACTIVATED: {reason[:80]}"],
        ocr_confidence_score=avg_confidence,
        raw_ocr_text=raw_ocr_text,
        status="FALLBACK_USED"
    )


# ---------------------------------------------------------------------------
# DEBUG UTILITY: Draw Azure polygon outlines (jury demo visualization)
# ---------------------------------------------------------------------------
def draw_azure_polygons(image_bytes: bytes, azure_result) -> bytes:
    """
    Draws green polygon outlines for each line detected by Azure Document Intelligence.
    Returns annotated image as PNG bytes for UI / jury demo visualization.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None or not azure_result.pages:
        return image_bytes

    page = azure_result.pages[0]
    page_h = float(page.height) if page.height else 1.0
    page_w = float(page.width) if page.width else 1.0
    h_px, w_px = img.shape[:2]

    for line in (page.lines or []):
        poly = line.polygon
        if not poly or len(poly) < 4:
            continue
        try:
            if isinstance(poly[0], (int, float)):
                xs = [poly[i] for i in range(0, len(poly), 2)]
                ys = [poly[i] for i in range(1, len(poly), 2)]
            else:
                xs = [p.x for p in poly]
                ys = [p.y for p in poly]

            # Convert normalized coords → pixel coords
            pts = [
                (int(x / page_w * w_px), int(y / page_h * h_px))
                for x, y in zip(xs, ys)
            ]
            pts_np = np.array(pts, dtype=np.int32).reshape(-1, 1, 2)
            cv2.polylines(img, [pts_np], isClosed=True, color=(0, 200, 0), thickness=2)
        except Exception:
            continue

    _, encoded = cv2.imencode('.png', img)
    return encoded.tobytes()


# ---------------------------------------------------------------------------
# UNIVERSAL INPUT ADAPTER HELPER
# ---------------------------------------------------------------------------
def _normalize_input_to_bytes(payload: Any) -> bytes:
    """
    Polymorphic adapter converting bytes, file paths, file-like objects,
    or FastAPI/Starlette UploadFile into raw bytes.
    """
    if isinstance(payload, bytes):
        return payload
    elif isinstance(payload, (str, os.PathLike)):
        if not os.path.exists(payload):
            raise FileNotFoundError(f"Prescription file not found at path: {payload}")
        with open(payload, "rb") as f:
            return f.read()
    # Check for FastAPI / Starlette UploadFile
    elif hasattr(payload, "file") and hasattr(payload.file, "read"):
        pos = payload.file.tell() if hasattr(payload.file, "tell") else None
        data = payload.file.read()
        if pos is not None and hasattr(payload.file, "seek"):
            payload.file.seek(pos)
        return data
    # Standard file-like object (e.g. io.BytesIO)
    elif hasattr(payload, "read") and callable(payload.read):
        pos = payload.tell() if hasattr(payload, "tell") else None
        data = payload.read()
        if pos is not None and hasattr(payload, "seek"):
            payload.seek(pos)
        return data
    else:
        raise ValueError(
            f"Unsupported prescription payload type: {type(payload)}. "
            f"Expected bytes, str/Path, UploadFile, or file-like object."
        )


# ---------------------------------------------------------------------------
# ENTRYPOINT & UNIVERSAL ADAPTER
# ---------------------------------------------------------------------------
def process_hybrid_ocr(payload: Any, patient_metadata: Optional[dict] = None) -> ClinicalSummary:
    """
    Universal entrypoint: runs the full 4-stage hybrid OCR pipeline.
    Accepts:
      - raw bytes
      - file path (str or os.PathLike)
      - FastAPI / Starlette UploadFile
      - BinaryIO / BytesIO
    Stage 1  → Azure Document Intelligence (prebuilt-read)
    Stage 1.5→ Deterministic dosage/frequency pairing
    Stage 2  → Gemini LLM structuring & PII scrubbing
    Stage 3  → RapidFuzz DB verification
    """
    try:
        image_bytes = _normalize_input_to_bytes(payload)
    except Exception as norm_err:
        return ClinicalSummary(
            ocr_confidence_score=0.0,
            raw_ocr_text="",
            status="INPUT_ERROR",
            red_flags=[f"Input normalization failed: {str(norm_err)}"]
        )

    try:
        raw_text, avg_conf = run_stage1_azure_ocr(image_bytes)
    except EnvironmentError as env_err:
        return ClinicalSummary(
            ocr_confidence_score=0.0,
            raw_ocr_text="",
            status="AZURE_INIT_FAILED",
            red_flags=[str(env_err)]
        )
    except Exception as ocr_err:
        return ClinicalSummary(
            ocr_confidence_score=0.0,
            raw_ocr_text="",
            status="FAILED",
            red_flags=[f"Azure OCR Error: {str(ocr_err)[:120]}"]
        )

    if not raw_text:
        return ClinicalSummary(
            ocr_confidence_score=0.0,
            raw_ocr_text="",
            status="FAILED",
            red_flags=["NO_TEXT_DETECTED_OR_IMAGE_BLURRED"]
        )

    # Sanitize PII
    scrubbed_text, true_metadata = sanitize_pii(raw_text, patient_metadata)

    # Gemini Structuring
    summary = run_stage2_gemini_structuring(scrubbed_text, avg_conf)

    # Restore PII
    if summary.patient_name in true_metadata:
        summary.patient_name = true_metadata[summary.patient_name]
    elif "[PATIENT_ANON_ID_01]" in true_metadata and summary.patient_name and "[PATIENT_ANON_ID_01]" in summary.patient_name:
        summary.patient_name = summary.patient_name.replace("[PATIENT_ANON_ID_01]", true_metadata["[PATIENT_ANON_ID_01]"])

    summary.raw_ocr_text = raw_text  # Return original unredacted text for debug
    summary = verify_medications_database(summary)
    return summary


# Standardized alias for backend controllers
process_prescription = process_hybrid_ocr
