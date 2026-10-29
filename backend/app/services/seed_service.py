import sys
import os
from sqlalchemy.orm import Session

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from seed_exact_image_data import seed_exact_data

def seed_database(db: Session) -> dict:
    """
    Seeds the APAAR-Vault database with the exact reference image dataset:
    12 institutions, 8,432 student records (6,892 verified, 1,340 pending, 186 issues),
    and 42 duplicate cases.
    """
    db_file_backend = os.path.join(BACKEND_DIR, "apaar_vault.db")
    seed_exact_data(db_file_backend)
    parent_dir = os.path.dirname(BACKEND_DIR)
    db_file_root = os.path.join(parent_dir, "apaar_vault.db")
    import shutil
    shutil.copy2(db_file_backend, db_file_root)
    return {
        "status": "SUCCESS",
        "message": "Demo database seeded successfully with 12 institutions, 8,432 student records, and 42 duplicate cases matching reference design.",
        "institutions": 12,
        "students": 8432,
        "verified": 6892,
        "pending": 1340,
        "validation_issues": 186,
        "duplicates": 42
    }
