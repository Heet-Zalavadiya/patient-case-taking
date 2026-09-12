import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import engine
from sqlalchemy import text


def export_database_backup():
    """Create a native SQL Server database backup (.bak) file if running on SQL Server."""
    backup_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "medikiosk_demo_backup.bak")
    )
    print(f"Creating SQL Server database backup at: {backup_path}")

    sql = text(
        f"""
        BACKUP DATABASE [medikiosk]
        TO DISK = '{backup_path}'
        WITH FORMAT, MEDIANAME = 'MediKioskBackup', NAME = 'Full Backup of MediKiosk Demo Data';
        """
    )

    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            conn.execute(sql)
            print(f"[SUCCESS] Native database backup exported to: {backup_path}")
        except Exception as e:
            print(f"[INFO] SQL Server backup notice: {e}")
            print("[INFO] Dual backup active: `python database/seed_demo_data.py` is available for instant 1-click restore!")


if __name__ == "__main__":
    export_database_backup()
