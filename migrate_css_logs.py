#!/usr/bin/env python3

from models import eng

def migrate_css_logs():
    conn = eng.connect()
    
    try:
        print("Updating css_logs table to allow nullable user_id...")
        conn.execute("ALTER TABLE css_logs ALTER COLUMN user_id DROP NOT NULL")
        
        print("CSS logs migration completed successfully!")
        
    except Exception as e:
        print(f"Error during CSS logs migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_css_logs() 