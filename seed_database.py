#!/usr/bin/env python3
"""
APAAR-Vault: Standalone Database Seeder Runner
Executes backend/generate_large_test_database.py to populate or reset
the synthetic test database (25 institutions, 125 courses, 1,200 students).
"""

import os
import sys
import subprocess

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
SCRIPT_PATH = os.path.join(BACKEND_DIR, "seed_exact_image_data.py")

if __name__ == "__main__":
    print(f"Running APAAR-Vault Exact Reference Image Database Generator: {SCRIPT_PATH}")
    result = subprocess.run([sys.executable, SCRIPT_PATH], cwd=BACKEND_DIR)
    sys.exit(result.returncode)
