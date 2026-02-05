import requests
import json

SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"
STAGE_ID = "f39d952a-147b-4b26-af0b-f6a9f0236e94"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

def check_connections():
    print(f"--- Event Participants - Connection Status ---")
    
    # 1. Get Event ID
    stage_res = requests.get(f"{SUPABASE_URL}/rest/v1/event_stages?select=event_id,name&id=eq.{STAGE_ID}", headers=headers)
    if stage_res.status_code != 200:
        print("Error fetching stage")
        return
    event_id = stage_res.json()[0]['event_id']

    # 2. Fetch Participants
    reg_res = requests.get(f"{SUPABASE_URL}/rest/v1/event_participants?select=user_id&event_id=eq.{event_id}", headers=headers)
    participants = reg_res.json()
    
    # 3. Fetch Profiles
    p_res = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=id,full_name", headers=headers)
    profiles_map = {p['id']: p.get('full_name', 'Unknown') for p in p_res.json()}

    # 4. Fetch Connections
    dc_res = requests.get(f"{SUPABASE_URL}/rest/v1/device_connections?select=user_id,is_active&platform=eq.strava", headers=headers)
    print(f"DEBUG: Raw connections response status: {dc_res.status_code}")
    print(f"DEBUG: Raw connections count: {len(dc_res.json())}")
    # print(f"DEBUG: First connection: {dc_res.json()[0] if dc_res.json() else 'None'}")
    
    connections_map = {d['user_id']: d.get('is_active', False) for d in dc_res.json()}

    print(f"{'Athlete':<30} | {'Strava Connected?':<20}")
    print("-" * 55)

    for p in participants:
        uid = p['user_id']
        name = profiles_map.get(uid, 'Unknown')
        is_connected = connections_map.get(uid, False)
        status = "YES" if is_connected else "NO"
        print(f"{name:<30} | {status:<20}")

if __name__ == "__main__":
    check_connections()
