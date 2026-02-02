import requests
import json

# Configuration
PROJECT_REF = "pvmknwhkgqloteqntqyr"
# Public Read access should be enabled for leaderboards usually, 
# or we use the Anon key if we had it.
# Actually, RLS usually allows public read on leaderboards.
URL = f"https://{PROJECT_REF}.supabase.co/rest/v1/event_leaderboard?select=*"

API_KEY = "ADD_ANON_KEY_HERE" # User has to provide this or I find it in .env

# I'll try to find the .end, but for now I'll create a script that asks for the key or tries without if public.
# Wait, I can read .env.local if it exists.

# Let's just use the python script to print instruction if it fails.
def check_leaderboard():
    print("Checking 'event_leaderboard' table...")
    headers = {
        "apikey": API_KEY,
        "Authorization": f"Bearer {API_KEY}"
    }
    try:
        response = requests.get(URL, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} rows.")
            print(json.dumps(data, indent=2))
        else:
            print(f"Error: {response.status_code} - {response.text}")
            print("NOTE: You need to replace API_KEY in the script with your Supabase Anon Key if this failed due to auth.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Asking user for key might be annoying.
    # I will try to read it from a file if I can, or just let the user run it and fail if auth needed.
    # But wait, I have access to the file system. I can read .env
    pass
