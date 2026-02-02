import requests
import json
import sys

# Configuration
PROJECT_REF = "pvmknwhkgqloteqntqyr"
FUNCTION_URL = f"https://{PROJECT_REF}.supabase.co/functions/v1/fetch-stage-results"

def test_fetch_results(stage_id):
    print(f"Testing fetch-stage-results for Stage ID: {stage_id}")
    print("-" * 50)

    try:
        # 1. First Attempt: Fetch Results (Smart Fetch should trigger auto-process if empty)
        params = {"stage_id": stage_id}
        # Note: We are sending NO headers first, as we disabled JWT verification.
        # If Supabase Gateway requires Anon Key even with --no-verify-jwt, this might fail,
        # but the user's GAS script was getting 400/200 responses, so access seems open.
        
        print(f"Requesting: {FUNCTION_URL}?stage_id={stage_id}")
        response = requests.get(FUNCTION_URL, params=params)
        
        print(f"Status Code: {response.status_code}")
        
        try:
            data = response.json()
            print("Response JSON:")
            print(json.dumps(data, indent=2))
            
            if "results" in data and not data["results"]:
                print("\n[WARNING] Results array is empty!")
                print("If you just ran this, wait 10-20 seconds for the background process (Smart Fetch) to finish, then try again.")
            
        except json.JSONDecodeError:
            print("Response Text (Not JSON):")
            print(response.text)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        s_id = sys.argv[1]
    else:
        print("Please provide the Stage ID you want to test.")
        # Try to help the user find it? No, keep it simple.
        s_id = input("Enter Stage ID: ").strip()
    
    if s_id:
        test_fetch_results(s_id)
    else:
        print("No Stage ID provided. Exiting.")
