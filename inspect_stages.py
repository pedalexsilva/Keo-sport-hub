import requests
import json

SUPABASE_URL = "https://pvmknwhkgqloteqntqyr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWtud2hrZ3Fsb3RlcW50cXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTE2MDEsImV4cCI6MjA4NTQyNzYwMX0.PwMxrjHsiyqmB2pPv6LSfF7YBE7nUpWTA_maBWq1vuI"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

def inspect_stage_schema():
    try:
        res = requests.get(f"{SUPABASE_URL}/rest/v1/event_stages?select=*&limit=1", headers=headers)
        if res.status_code == 200:
            stages = res.json()
            if stages:
                print("Columns:", stages[0].keys())
                print("Sample:", stages[0])
            else:
                print("No stages found.")
        else:
            print(f"Error: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_stage_schema()
