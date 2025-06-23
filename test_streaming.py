#!/usr/bin/env python3
"""
Simple Python script to test Flask streaming endpoints
"""

import requests
import time

def test_streaming_endpoint(url):
    print(f"🧪 Testing streaming endpoint: {url}")
    print("=" * 50)
    
    try:
        # Make request with streaming enabled
        response = requests.get(url, stream=True)
        
        print(f"📡 Response status: {response.status_code}")
        print(f"📋 Response headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        print("-" * 30)
        
        if response.status_code != 200:
            print(f"❌ Error: HTTP {response.status_code}")
            print(response.text)
            return
        
        print("📺 Starting to read stream...")
        print("=" * 50)
        
        # Read the response line by line
        start_time = time.time()
        line_count = 0
        
        for line in response.iter_lines(decode_unicode=True):
            if line:  # Skip empty lines
                current_time = time.time()
                elapsed = current_time - start_time
                line_count += 1
                
                print(f"[{elapsed:.2f}s] Line {line_count}: {line}")
                
                # Check if it's a server-sent event data line
                if line.startswith('data: '):
                    data = line[6:]  # Remove 'data: ' prefix
                    print(f"  🔥 SSE Data: {data}")
                    
                    if data == '[DONE]':
                        print("✅ Stream completed successfully!")
                        break
                        
        print("=" * 50)
        print(f"📊 Total lines received: {line_count}")
        print(f"⏱️  Total time: {time.time() - start_time:.2f}s")
        
    except requests.exceptions.RequestException as e:
        print(f"💥 Request failed: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"💥 Unexpected error: {e}")

def test_css_generation(base_url, access_token, instruction):
    print(f"🎨 Testing CSS generation endpoint")
    print("=" * 50)
    
    try:
        url = f"{base_url}/api/generate_css?access_token={access_token}"
        payload = {"instruction": instruction}
        
        # Make POST request with streaming
        response = requests.post(
            url, 
            json=payload, 
            stream=True,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📡 Response status: {response.status_code}")
        print(f"📋 Response headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        print("-" * 30)
        
        if response.status_code != 200:
            print(f"❌ Error: HTTP {response.status_code}")
            print(response.text)
            return
        
        print("📺 Starting to read CSS generation stream...")
        print("=" * 50)
        
        start_time = time.time()
        line_count = 0
        css_content = ""
        
        for line in response.iter_lines(decode_unicode=True):
            if line:
                current_time = time.time()
                elapsed = current_time - start_time
                line_count += 1
                
                print(f"[{elapsed:.2f}s] {line}")
                
                if line.startswith('data: '):
                    data = line[6:]
                    if data == '[DONE]':
                        print("✅ CSS generation completed!")
                        print(f"📝 Total CSS generated: {len(css_content)} characters")
                        break
                    elif data.startswith('[ERROR]'):
                        print(f"❌ Error: {data}")
                        break
                    else:
                        css_content += data
                        
        print("=" * 50)
        print(f"📊 Total lines received: {line_count}")
        print(f"⏱️  Total time: {time.time() - start_time:.2f}s")
        
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == "__main__":
    # Configuration
    BASE_URL = "http://localhost:5001"  # Adjust if your Flask app runs on different port
    
    print("🚀 Flask Streaming Test Script")
    print("=" * 50)
    
    # Test 1: Simple streaming test
    print("\n1️⃣  Testing simple streaming endpoint...")
    test_streaming_endpoint(f"{BASE_URL}/api/test_stream")
    
    # Test 2: CSS generation (optional - uncomment and provide token)
    # print("\n2️⃣  Testing CSS generation endpoint...")
    # ACCESS_TOKEN = "your_facebook_access_token_here"  # Replace with real token
    # INSTRUCTION = "make it look cyberpunk"
    # test_css_generation(BASE_URL, ACCESS_TOKEN, INSTRUCTION)
    
    print("\n🏁 Test completed!") 