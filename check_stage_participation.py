import requests
import json
from datetime import datetime

SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"
STAGE_ID = "f39d952a-147b-4b26-af0b-f6a9f0236e94"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

def format_time(seconds):
    """Format seconds to HH:MM:SS"""
    if not seconds:
        return "-"
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

def check_participation():
    print(f"--- Event Participants - Stage 1 Status ---")
    print(f"Stage ID: {STAGE_ID}")
    print(f"Report Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 1. Get Event ID from Stage
    event_id = None
    try:
        stage_res = requests.get(f"{SUPABASE_URL}/rest/v1/event_stages?select=event_id,name&id=eq.{STAGE_ID}", headers=headers)
        if stage_res.status_code == 200:
            stages = stage_res.json()
            if stages:
                event_id = stages[0]['event_id']
                stage_name = stages[0]['name']
                print(f"Stage Name: {stage_name}")
                print(f"Event ID: {event_id}\n")
    except Exception as e:
        print(f"Error fetching stage: {e}")
        return

    if not event_id:
        print("Could not find event for this stage.")
        return

    # 2. Fetch Profiles
    profiles_map = {}
    try:
        p_res = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=id,full_name", headers=headers)
        if p_res.status_code == 200:
            for p in p_res.json():
                profiles_map[p['id']] = p.get('full_name', 'Unknown')
    except Exception as e:
        print(f"Error fetching profiles: {e}")

    # 3. Fetch Registered Athletes for this Event from event_participants
    registered_users = {}
    try:
        reg_res = requests.get(f"{SUPABASE_URL}/rest/v1/event_participants?select=user_id,joined_at&event_id=eq.{event_id}", headers=headers)
        if reg_res.status_code == 200:
            for reg in reg_res.json():
                registered_users[reg['user_id']] = reg.get('joined_at', 'N/A')
        print(f"Registered Athletes: {len(registered_users)}")
    except Exception as e:
        print(f"Error fetching participants: {e}")

    # 4. Fetch Stage Results
    results_map = {}
    try:
        sr_res = requests.get(f"{SUPABASE_URL}/rest/v1/stage_results?select=*&stage_id=eq.{STAGE_ID}", headers=headers)
        if sr_res.status_code == 200:
            for r in sr_res.json():
                results_map[r['user_id']] = r
    except Exception as e:
        print(f"Error fetching stage results: {e}")

    # 5. Print Full Table
    print("\n" + "="*100)
    print(f"{'Athlete':<25} | {'Registered':<12} | {'Has Result':<10} | {'Status':<10} | {'Elapsed Time':<12} | {'Activity ID'}")
    print("="*100)
    
    with_results = 0
    without_results = 0
    
    for user_id in registered_users:
        name = profiles_map.get(user_id, 'Unknown')[:25]
        reg_date = registered_users[user_id]
        if reg_date and reg_date != 'N/A':
            try:
                dt = datetime.fromisoformat(reg_date.replace('Z', '+00:00'))
                reg_date = dt.strftime('%Y-%m-%d')
            except:
                pass
        
        result = results_map.get(user_id)
        if result:
            with_results += 1
            has_result = "YES"
            status = result.get('status', 'pending')
            elapsed = format_time(result.get('elapsed_time_seconds'))
            activity_id = result.get('strava_activity_id', '-')
        else:
            without_results += 1
            has_result = "NO"
            status = "-"
            elapsed = "-"
            activity_id = "-"
        
        print(f"{name:<25} | {reg_date:<12} | {has_result:<10} | {status:<10} | {elapsed:<12} | {activity_id}")

    print("="*100)
    print(f"\nSummary: {with_results} with results, {without_results} without results (out of {len(registered_users)} registered)")

    if without_results > 0:
        print("\n--- Missing Users Detail ---")
        for user_id in registered_users:
             if user_id not in results_map:
                 name = profiles_map.get(user_id, 'Unknown')
                 print(f"Missing: {name} (ID: {user_id})")

if __name__ == "__main__":
    check_participation()
