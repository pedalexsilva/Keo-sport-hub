import requests
import json
import sys

# Configuration
PROJECT_REF = "pvmknwhkgqloteqntqyr"
FINALIZE_URL = f"https://{PROJECT_REF}.supabase.co/functions/v1/finalize-stage-results"

def test_publish_results(stage_id, result_id, time_seconds=3600):
    print(f"Testing PUBLISH (finalize-stage-results) for Stage ID: {stage_id}")
    print("-" * 50)

    payload = {
        "stage_id": stage_id,
        "results": [
            {
                "result_id": result_id,
                "official_time_seconds": int(time_seconds),
                "mountain_points": 10, # Giving some points for testing
                "status": "official"
            }
        ]
    }
    
    print("Sending Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        # Note: Depending on RLS, this might need a Service Role Key in headers if Anon isn't allowed to finalize.
        # But let's try with basic POST first as the function seems open or we can add the key if needed.
        # However, finalize usually requires admin rights. Let's see if it fails.
        # If it fails, we might need to add: 'Authorization': 'Bearer <SERVICE_ROLE>' 
        # For now, assuming the function expects a Service Role or has logic to handle it.
        # Actually, looking at index.ts, it instantiates Supabase with Env Vars, so it might not Check the incoming user token strictly if not verified?
        # Let's try.
        
        response = requests.post(FINALIZE_URL, json=payload)
        
        print(f"\nStatus Code: {response.status_code}")
        print("Response Text:")
        print(response.text)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        s_id = sys.argv[1]
        r_id = sys.argv[2]
        test_publish_results(s_id, r_id)
    else:
        print("Usage: python publish_results_test.py <STAGE_ID> <RESULT_ID>")
        s_id = input("Enter Stage ID: ").strip()
        r_id = input("Enter Result ID (from fetch test): ").strip()
        
        if s_id and r_id:
            test_publish_results(s_id, r_id)
