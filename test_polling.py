#!/usr/bin/env python3
"""
Simple Python script to test the polling-based CSS generation
"""

import requests
import time
import json

def test_css_polling(base_url, access_token, instruction):
    print(f"🎨 Testing CSS generation with polling")
    print(f"💭 Instruction: {instruction}")
    print("=" * 60)
    
    try:
        # Step 1: Start CSS generation
        print("1️⃣  Starting CSS generation...")
        start_url = f"{base_url}/api/generate_css?access_token={access_token}"
        payload = {"instruction": instruction}
        
        response = requests.post(
            start_url,
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to start generation: HTTP {response.status_code}")
            print(response.text)
            return
        
        data = response.json()
        session_id = data.get('session_id')
        if not session_id:
            print("❌ No session ID received")
            print(data)
            return
        
        print(f"✅ Generation started! Session ID: {session_id}")
        print("-" * 40)
        
        # Step 2: Poll for updates
        poll_url = f"{base_url}/api/poll_css/{session_id}"
        poll_count = 0
        total_content = ""
        
        while True:
            poll_count += 1
            print(f"🔄 Poll #{poll_count} at {time.strftime('%H:%M:%S')}")
            
            try:
                poll_response = requests.get(poll_url)
                
                if poll_response.status_code != 200:
                    print(f"❌ Poll failed: HTTP {poll_response.status_code}")
                    print(poll_response.text)
                    break
                
                poll_data = poll_response.json()
                content = poll_data.get('content', '')
                done = poll_data.get('done', False)
                error = poll_data.get('error')
                
                if error:
                    print(f"❌ Error: {error}")
                    break
                
                if content:
                    print(f"📄 New content ({len(content)} chars):")
                    # Show first 100 chars of new content
                    preview = content[:100] + "..." if len(content) > 100 else content
                    print(f"   {repr(preview)}")
                    total_content += content
                else:
                    print("⏳ No new content yet...")
                
                if done:
                    print("✅ Generation completed!")
                    break
                
                print(f"📊 Total content so far: {len(total_content)} characters")
                print("-" * 40)
                
                # Wait 2 seconds before next poll
                time.sleep(2)
                
            except requests.exceptions.RequestException as e:
                print(f"💥 Poll request failed: {e}")
                break
        
        # Final results
        print("=" * 60)
        print(f"📊 Final Stats:")
        print(f"   Total polls: {poll_count}")
        print(f"   Total content: {len(total_content)} characters")
        print(f"   First 200 chars: {repr(total_content[:200])}")
        if len(total_content) > 200:
            print(f"   Last 200 chars: {repr(total_content[-200:])}")
        
    except Exception as e:
        print(f"💥 Unexpected error: {e}")

def test_simple_polling():
    """Test polling without authentication for debugging"""
    print("🧪 Simple polling test (no auth required)")
    print("=" * 40)
    
    # You can add a simple test endpoint here if needed
    print("⚠️  This would require a test endpoint without auth")

if __name__ == "__main__":
    # Configuration
    BASE_URL = "http://localhost:5001"  # Adjust if your Flask app runs on different port
    
    print("🚀 CSS Generation Polling Test Script")
    print("=" * 60)
    
    # Option 1: Test with real access token (uncomment and provide token)
    print("\n🔐 Testing with authentication...")
    ACCESS_TOKEN = input("Enter your Facebook access token (or press Enter to skip): ").strip()
    
    if ACCESS_TOKEN:
        INSTRUCTION = input("Enter CSS instruction (or press Enter for default): ").strip()
        if not INSTRUCTION:
            INSTRUCTION = "make it look like a cyberpunk theme with neon colors"
        
        test_css_polling(BASE_URL, ACCESS_TOKEN, INSTRUCTION)
    else:
        print("⏭️  Skipping authenticated test")
    
    print("\n🏁 Test completed!") 