import requests
import json
from datetime import datetime, timezone

# Configuration from .env (hardcoded for convenience in this utility)
SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"

def get_all_athletes_latest_strava():
    print(f"--- Latest Strava Activity per Athlete ---")
    print(f"Current UTC Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }

    # 1. Fetch all profiles
    profiles_map = {}
    try:
        p_res = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=id,full_name", headers=headers)
        if p_res.status_code == 200:
            for p in p_res.json():
                profiles_map[p['id']] = p.get('full_name', 'Unknown')
    except Exception as e:
        print(f"Warning: Could not fetch profiles: {e}")

    # 2. Fetch ALL strava activities (ordered by time)
    url = f"{SUPABASE_URL}/rest/v1/workout_metrics?select=title,start_time,user_id,source_platform&source_platform=eq.strava&order=start_time.desc"

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            activities = response.json()
            if not activities:
                print("No Strava activities found in the database.")
                return

            # Group by user and take the first (latest) one
            latest_per_user = {}
            for act in activities:
                u_id = act['user_id']
                if u_id not in latest_per_user:
                    latest_per_user[u_id] = act

            today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
            
            print(f"{'Athlete':<20} | {'Latest Activity':<30} | {'Date':<12} | {'Today?'}")
            print("-" * 80)
            
            # Sort by date desc
            sorted_users = sorted(latest_per_user.keys(), key=lambda x: latest_per_user[x]['start_time'], reverse=True)
            
            for u_id in sorted_users:
                act = latest_per_user[u_id]
                athlete = profiles_map.get(u_id, u_id[:20])
                title = act.get('title', 'No Title')
                start_time = act.get('start_time', '')
                date_str = start_time.split('T')[0] if start_time else 'Unknown'
                is_today = "YES" if date_str == today_str else ""
                
                print(f"{athlete[:20]:<20} | {title[:30]:<30} | {date_str:<12} | {is_today}")
            
            print(f"\nTotal athletes with Strava activities: {len(latest_per_user)}")
        else:
            print(f"Error fetching data: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_all_athletes_latest_strava()
