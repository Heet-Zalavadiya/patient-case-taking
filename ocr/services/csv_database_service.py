import os
import re
import gzip
import sqlite3
import pandas as pd
from typing import Dict, Any, Optional
from rapidfuzz import process, fuzz

class LocalDrugDatabaseService:
    """
    Directly loads Indian Medicines CSV or compressed .csv.gz into a local SQLite 
    database and provides fast fuzzy matching.
    """

    def __init__(self, csv_filepath: Optional[str] = None, db_filepath: Optional[str] = None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        self.base_dir = base_dir
        self.csv_filepath = csv_filepath or os.path.join(base_dir, "medicine.csv")
        self.gz_csv_filepath = os.path.join(base_dir, "medicine.csv.gz")
        self.db_filepath = db_filepath or os.path.join(base_dir, "drugs.db")
        
        self.brand_list = []
        self.drug_records = {}
        self._initialize_database()

    def _initialize_database(self):
        """Builds SQLite DB from CSV/GZ if missing, and initializes the in-memory search index."""
        os.makedirs(os.path.dirname(self.db_filepath), exist_ok=True)
        
        seed_medicines = [
            {"name": "Augmentin 625 Duo Tablet", "composition": "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "manufacturer": "GSK"},
            {"name": "Augmentin 625mg", "composition": "Amoxicillin (500mg) + Clavulanic Acid (125mg)", "manufacturer": "GSK"},
            {"name": "Enzoflam Tablet", "composition": "Paracetamol (325mg) + Diclofenac (50mg) + Serratiopeptidase (15mg)", "manufacturer": "Alkem"},
            {"name": "Enzoflam", "composition": "Paracetamol (325mg) + Diclofenac (50mg) + Serratiopeptidase (15mg)", "manufacturer": "Alkem"},
            {"name": "Pan 40 Tablet", "composition": "Pantoprazole (40mg)", "manufacturer": "Alkem"},
            {"name": "Pan-D 40mg", "composition": "Pantoprazole (40mg) + Domperidone (30mg)", "manufacturer": "Alkem"},
            {"name": "PanD", "composition": "Pantoprazole (40mg) + Domperidone (30mg)", "manufacturer": "Alkem"},
            {"name": "Hexigel Mouth Gel", "composition": "Chlorhexidine Gluconate (1% w/v)", "manufacturer": "ICPA Health Products"},
            {"name": "Hexigel", "composition": "Chlorhexidine Gluconate (1% w/v)", "manufacturer": "ICPA Health Products"},
            {"name": "Dolo 650 Tablet", "composition": "Paracetamol (650mg)", "manufacturer": "Micro Labs"},
            {"name": "Azithral 500 Tablet", "composition": "Azithromycin (500mg)", "manufacturer": "Alembic"},
            {"name": "Glycomet 500 Tablet", "composition": "Metformin (500mg)", "manufacturer": "USV"}
        ]

        # Step 1: If SQLite DB doesn't exist, create it from CSV or .csv.gz
        if not os.path.exists(self.db_filepath):
            print(f"[INIT] {self.db_filepath} not found. Building database from seed data...")
            df = None

            # Priority 1: Check raw uncompressed CSV
            if os.path.exists(self.csv_filepath):
                print(f"[INIT] Loading from uncompressed {self.csv_filepath}...")
                df = pd.read_csv(self.csv_filepath)
            # Priority 2: Check compressed CSV (.gz)
            elif os.path.exists(self.gz_csv_filepath):
                print(f"[INIT] Loading from compressed archive {self.gz_csv_filepath}...")
                with gzip.open(self.gz_csv_filepath, "rt", encoding="utf-8") as gz_file:
                    df = pd.read_csv(gz_file)
            # Priority 3: Fallback to built-in seed records
            else:
                print("[WARN] Neither CSV nor .gz found. Falling back to built-in seed list...")
                df = pd.DataFrame(seed_medicines)

            # Normalize column names
            df.columns = [col.lower().strip() for col in df.columns]
            name_col = "name" if "name" in df.columns else df.columns[0]
            existing_names = set(df[name_col].astype(str).str.lower().str.strip())
            
            # Ensure essential seed entries exist
            new_rows = [m for m in seed_medicines if m["name"].lower().strip() not in existing_names]
            if new_rows:
                df = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)

            # Write into SQLite
            conn = sqlite3.connect(self.db_filepath)
            df.to_sql("medicines", conn, if_exists="replace", index=False)
            
            # Create an index for fast lookups
            conn.execute(f"CREATE INDEX IF NOT EXISTS idx_medicine_name ON medicines ([{name_col}]);")
            conn.close()
            print(f"[OK] Created and indexed {self.db_filepath} successfully.")

        # Step 2: Load database records into memory for RapidFuzz
        conn = sqlite3.connect(self.db_filepath)
        cursor = conn.cursor()
        
        # Discover table columns
        cursor.execute("PRAGMA table_info(medicines);")
        columns = [row[1].lower() for row in cursor.fetchall()]
        
        name_col = "name" if "name" in columns else columns[0]
        comp_col = "composition" if "composition" in columns else (columns[1] if len(columns) > 1 else name_col)

        cursor.execute(f"SELECT [{name_col}], [{comp_col}] FROM medicines")
        rows = cursor.fetchall()
        conn.close()

        self.brand_list = []
        self.drug_records = {}
        for brand, comp in rows:
            brand_str = str(brand).strip()
            if brand_str and brand_str not in self.drug_records:
                self.brand_list.append(brand_str)
                self.drug_records[brand_str] = str(comp) if comp else "Generic Composition Not Listed"

        print(f"[OK] Loaded {len(self.brand_list)} Indian medicine records into memory for fuzzy matching.")

    def query_drug(self, raw_drug_name: str, fuzzy_threshold: float = 55.0) -> Dict[str, Any]:
        """
        Queries the database for exact or fuzzy matches against Indian drug records.
        Applies whitespace stripping and lower-case token matching.
        """
        if not raw_drug_name or str(raw_drug_name).upper() in ["UNCLEAR", "REFER RAW TEXT"]:
            return {
                "matched_brand": "UNCLEAR",
                "generic_composition": None,
                "confidence": 0.0,
                "status": "ILLEGIBLE"
            }

        # Strip prefixes like Tab., Cap., Adv:, Gel
        clean_name = str(raw_drug_name).strip().lower()
        clean_name = re.sub(r'^(tab\.?|cap\.?|adv:?|syr\.?|gel\.?)\s*', '', clean_name, flags=re.IGNORECASE).strip()

        if not clean_name:
            return {
                "matched_brand": raw_drug_name,
                "generic_composition": "Unregistered Brand",
                "confidence": 0.0,
                "status": "UNREGISTERED"
            }

        brand_lower_map = {b.lower(): b for b in self.brand_list}
        choices = list(brand_lower_map.keys())

        # Primary RapidFuzz token sort match
        match = process.extractOne(clean_name, choices, scorer=fuzz.token_sort_ratio)
        if not match or match[1] < fuzzy_threshold:
            # Fallback to partial ratio
            match_partial = process.extractOne(clean_name, choices, scorer=fuzz.partial_ratio)
            if match_partial and match_partial[1] > (match[1] if match else 0):
                match = match_partial

        if match:
            matched_lower, score, _ = match
            matched_brand = brand_lower_map[matched_lower]
            if score >= fuzzy_threshold:
                return {
                    "matched_brand": matched_brand,
                    "generic_composition": self.drug_records.get(matched_brand, "N/A"),
                    "confidence": round(score, 2),
                    "status": "VERIFIED_IN_DATABASE"
                }

        return {
            "matched_brand": raw_drug_name,
            "generic_composition": "Unregistered Brand",
            "confidence": 0.0,
            "status": "UNREGISTERED"
        }