-- Query to view recent Strava activities (last 3 days)
-- Run this in the Supabase SQL Editor

SELECT 
    w.start_time AT TIME ZONE 'UTC' as start_time_utc,
    p.full_name as athlete,
    w.title as activity_name,
    w.type as activity_type,
    ROUND((w.distance_meters / 1000)::numeric, 2) as distance_km,
    w.calories,
    w.source_platform
FROM 
    workout_metrics w
JOIN 
    profiles p ON w.user_id = p.id
WHERE 
    w.start_time >= CURRENT_DATE - INTERVAL '3 days'
    AND w.source_platform = 'strava'
ORDER BY 
    w.start_time DESC;

-- Alternative for the 'activities' table if data is mirrored there:
/*
SELECT 
    a.date,
    p.full_name,
    a.title,
    a.type,
    ROUND((a.distance / 1000)::numeric, 2) as distance_km,
    a.points
FROM 
    activities a
JOIN 
    profiles p ON a.user_id = p.id
WHERE 
    a.date >= CURRENT_DATE
    AND a.date < CURRENT_DATE + INTERVAL '1 day'
    AND a.source = 'strava'
ORDER BY 
    a.date DESC;
*/
