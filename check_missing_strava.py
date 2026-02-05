import requests
import json
from datetime import datetime, timezone

# Configuration from .env (hardcoded for convenience based on get_today_strava.py)
SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"

def check_missing_strava_uploads():
    print(f"--- Users Pending Strava Upload for Today ---")
    today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    print(f"Date: {today_str}\n")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }

    # 1. Fetch all profiles to get names
    profiles_map = {}
    try:
        p_res = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=id,full_name", headers=headers)
        if p_res.status_code == 200:
            for p in p_res.json():
                profiles_map[p['id']] = p.get('full_name', 'Unknown')
        else:
            print(f"Error fetching profiles: {p_res.status_code}")
            return
    except Exception as e:
        print(f"Warning: Could not fetch profiles: {e}")
        return

    # 2. Fetch all active Strava connections (Users who SHOULD upload)
    connected_users = set()
    try:
        dc_res = requests.get(f"{SUPABASE_URL}/rest/v1/device_connections?select=user_id&platform=eq.strava&is_active=eq.true", headers=headers)
        if dc_res.status_code == 200:
            for dc in dc_res.json():
                connected_users.add(dc['user_id'])
        else:
            print(f"Error fetching device connections: {dc_res.status_code}")
            return
    except Exception as e:
        print(f"Warning: Could not fetch device connections: {e}")
        return

    print(f"Total users with active Strava connection (from device_connections): {len(connected_users)}")

    # FALLBACK: If device_connections is empty (maybe migration hasn't backfilled),
    # get distinct users who have ANY workout_metrics from Strava in the past.
    if not connected_users:
        print("Warning: No active connections found in 'device_connections'. Falling back to historical workout metrics...")
        try:
            # fetch all unique user_ids from workout_metrics with strava
            # We can't do distinct easily with postgrest select in one go without rpc, 
            # but we can fetch user_id and dedupe in python. 
            # Limit to a reasonable amount if needed, or just fetch all user_ids.
            wm_res = requests.get(f"{SUPABASE_URL}/rest/v1/workout_metrics?select=user_id&source_platform=eq.strava", headers=headers)
            if wm_res.status_code == 200:
                for row in wm_res.json():
                    connected_users.add(row['user_id'])
            print(f"Found {len(connected_users)} users with historical Strava activities.")
        except Exception as e:
            print(f"Error fetching historical metrics: {e}")

    # 3. Fetch Strava activities for TODAY
    # We filter by start_time being today. 
    # Note: This simple string matching relies on ISO format yyyy-mm-dd
    uploaded_users = set()
    url = f"{SUPABASE_URL}/rest/v1/workout_metrics?select=user_id,start_time&source_platform=eq.strava&start_time=gte.{today_str}T00:00:00&start_time=lte.{today_str}T23:59:59"

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            activities = response.json()
            for act in activities:
                uploaded_users.add(act['user_id'])
        else:
            print(f"Error fetching workout metrics: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"Error: {e}")
        return

    print(f"Total users with activities today: {len(uploaded_users)}")

    # 4. Determine missing users
    missing_users = connected_users - uploaded_users
    
    # 5. Output results
    print("\n" + "="*50)
    print(f"MISSING ACTIVITES ({len(missing_users)} users)")
    print("="*50)
    
    sorted_missing = sorted([profiles_map.get(uid, f"Unknown ({uid})") for uid in missing_users])
    
    for name in sorted_missing:
        print(f"- {name}")

    if not missing_users:
        print("Great news! Everyone has uploaded their activities.")

if __name__ == "__main__":
    check_missing_strava_uploads()
