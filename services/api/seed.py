import sys
import os

# Add current dir to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import engine, Base, SessionLocal
from app.api.v1.reports import seed_system_data

def main():
    print("Membuat tabel database jika belum ada...")
    Base.metadata.create_all(bind=engine)
    print("Menjalankan seed data simulasi rantai pasok Trawas...")
    with SessionLocal() as db:
        res = seed_system_data(db)
        print(f"Hasil: {res}")
    print("Selesai!")

if __name__ == "__main__":
    main()
