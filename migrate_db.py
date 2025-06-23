#!/usr/bin/env python3

from models import eng

def migrate_database():
    conn = eng.connect()
    
    try:
        print("Adding phone_number column...")
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)")
        
        print("Adding dating_doc_link column...")
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS dating_doc_link TEXT")
        
        print("Adding custom_css column...")
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_css TEXT")
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database() 