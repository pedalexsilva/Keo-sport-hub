import requests
import json
from datetime import datetime, timedelta

SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

MISSING_USERS = [
    {"id": "4132bc2a-ae8d-41de-9a64-3dc4a81b629f", "name": "Mateusz Lukasiewicz"},
    {"id": "1197a54d-3ee6-4dcd-80bf-ff908765a465", "name": "Lars Hansen"}
]
STAGE_DATE = "2026-02-04"

def debug_users():
    print(f"--- Debugging Missing Strava Users ---")
    print(f"Target Date: {STAGE_DATE}\n")

    for user in MISSING_USERS:
        uid = user['id']
        name = user['name']
        print(f"Checking: {name} ({uid})")

        # 1. Check Connection
        try:
            url = f"{SUPABASE_URL}/rest/v1/device_connections?select=*&user_id=eq.{uid}&platform=eq.strava"
            res = requests.get(url, headers=headers)
            connections = res.json()
            if connections:
                active = connections[0].get('is_active', False)
                print(f"  > Strava Connection: FOUND (Active: {active})")
            else:
                print(f"  > Strava Connection: NOT FOUND")
        except Exception as e:
            print(f"  > Error checking connection: {e}")

        # 2. Check Activities on Date
        try:
            # Check full day
            start_date = STAGE_DATE
            end_date = STAGE_DATE # Same day, just simple string match for now or range
            
            # Using range filter
            url = f"{SUPABASE_URL}/rest/v1/workout_metrics?select=id,start_time,distance,elapsed_time&user_id=eq.{uid}&source_platform=eq.strava&start_time=gte.{start_date}T00:00:00&start_time=lte.{end_date}T23:59:59"
            
            res = requests.get(url, headers=headers)
            activities = res.json()
            
            if isinstance(activities, list):
                if activities:
                    print(f"  > Activities on {STAGE_DATE}: {len(activities)}")
                    for act in activities:
                        print(f"    - {act.get('start_time')}: {act.get('name', 'No Name')} (Dist: {act.get('distance', 0)}m, Time: {act.get('elapsed_time', 0)}s)")
                else:
                    print(f"  > Activities on {STAGE_DATE}: NONE FOUND in workout_metrics")
            else:
                 print(f"  > ERROR fetching activities: {activities}")
                
        except Exception as e:
            print(f"  > Error checking activities: {e}")

        print("")

if __name__ == "__main__":
    debug_users()
