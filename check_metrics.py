
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY")
    exit(1)

supabase: Client = create_client(url, key)

print(f"Connecting to {url}...")

# Fetch workout_metrics
try:
    response = supabase.table("workout_metrics").select("*").order("start_time", desc=True).limit(10).execute()
    data = response.data
    
    print(f"Items found: {len(data)}")
    
    if len(data) == 0:
        print("Table 'workout_metrics' is empty.")
    else:
        print("Most recent 10 activities:")
        for item in data:
            print(f"- Date: {item.get('start_time')}, Title: {item.get('title')}, Type: {item.get('type')}")
            
except Exception as e:
    print(f"Error fetching data: {e}")
