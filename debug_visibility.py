import requests
import json
from datetime import datetime, timezone

# Configuration
SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"

def debug_activities():
    print("--- Debugging Activities Visibility ---")
    
    # Check all activities in workout_metrics regardless of date (just to see if others exist)
    url = f"{SUPABASE_URL}/rest/v1/workout_metrics?select=user_id,start_time,source_platform"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            activities = response.json()
            print(f"Total activities found in workout_metrics: {len(activities)}")
            
            # Count distinct users
            users = set(act['user_id'] for act in activities)
            print(f"Total distinct users with activities: {len(users)}")
            
            # Show last 5 activities
            print("\nLast 5 activities:")
            for act in sorted(activities, key=lambda x: x['start_time'], reverse=True)[:5]:
                print(f"User: {act['user_id']}, Time: {act['start_time']}, Platform: {act['source_platform']}")
        else:
            print(f"Error workout_metrics: {response.status_code} - {response.text}")
            
        # Check profiles
        profile_url = f"{SUPABASE_URL}/rest/v1/profiles?select=id,full_name"
        p_response = requests.get(profile_url, headers=headers)
        if p_response.status_code == 200:
            profiles = p_response.json()
            print(f"\nTotal profiles found: {len(profiles)}")
            for p in profiles[:5]:
                print(f"Profile: {p['id']}, Name: {p['full_name']}")
        # Check activities table
        act_url = f"{SUPABASE_URL}/rest/v1/activities?select=user_id,date,source"
        a_response = requests.get(act_url, headers=headers)
        if a_response.status_code == 200:
            acts = a_response.json()
            print(f"\nTotal activities found in activities table: {len(acts)}")
            
            # Count for today
            today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
            today_acts = [a for a in acts if a['date'].startswith(today)]
            print(f"Activities found for today in activities table: {len(today_acts)}")
            
            users_today = set(a['user_id'] for a in today_acts)
            print(f"Distinct users with activities today: {len(users_today)}")
            
            for a in today_acts:
                print(f"User: {a['user_id']}, Time: {a['date']}, Source: {a['source']}")
        else:
            print(f"Error activities: {a_response.status_code} - {a_response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_activities()
