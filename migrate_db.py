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
        
        print("Adding has_logged_in_since_reboot column...")
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS has_logged_in_since_reboot BOOLEAN DEFAULT FALSE")
        
        print("Adding visibility_setting column...")
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS visibility_setting VARCHAR(20) DEFAULT 'friends'")
        
        print("Creating tagline_logs table...")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tagline_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                user_id INTEGER NOT NULL REFERENCES users(id),
                user_name VARCHAR(100) NOT NULL,
                instruction TEXT NOT NULL,
                generated_tagline TEXT NOT NULL
            )
        """)
        
        print("Creating css_logs table...")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS css_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                user_id INTEGER NOT NULL REFERENCES users(id),
                user_name VARCHAR(100) NOT NULL,
                instruction TEXT NOT NULL,
                generated_css TEXT NOT NULL
            )
        """)
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database() 