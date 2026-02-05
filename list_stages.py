import requests
import json
import os

SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

def list_stages():
    print("--- Stages ---")
    try:
        # Fetch event_stages with event name if possible, or just print them
        res = requests.get(f"{SUPABASE_URL}/rest/v1/event_stages?select=id,name,event_id,start_date,stage_number", headers=headers)
        if res.status_code == 200:
            stages = res.json()
            for s in stages:
                print(f"ID: {s['id']} | Event: {s['event_id']} | Stage: {s['stage_number']} - {s['name']} | Date: {s['start_date']}")
        else:
            print(f"Error: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_stages()
