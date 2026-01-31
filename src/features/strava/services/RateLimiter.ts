export class StravaRateLimiter {
    private static STORAGE_KEY = 'strava_api_usage';

    // Strava Standard Limits: 100 requests per 15 minutes, 1000 per day
    // We use slightly lower safeguards to be safe.
    private static LIMIT_15_MIN = 80;
    private static LIMIT_DAILY = 800;

    static async canMakeRequest(): Promise<boolean> {
        const usage = this.getUsage();
        const now = Date.now();

        // Reset counters if time windows have passed
        if (now - usage.window15MinStart > 15 * 60 * 1000) {
            usage.requests15Min = 0;
            usage.window15MinStart = now;
        }

        if (now - usage.windowDailyStart > 24 * 60 * 60 * 1000) {
            usage.requestsDaily = 0;
            usage.windowDailyStart = now;
        }

        // Check limits
        if (usage.requests15Min >= this.LIMIT_15_MIN) {
            console.warn('Strava 15-min rate limit reached.');
            return false;
        }

        if (usage.requestsDaily >= this.LIMIT_DAILY) {
            console.warn('Strava daily rate limit reached.');
            return false;
        }

        return true;
    }

    static incrementUsage() {
        const usage = this.getUsage();
        usage.requests15Min++;
        usage.requestsDaily++;
        this.saveUsage(usage);
    }

    private static getUsage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            requests15Min: 0,
            window15MinStart: Date.now(),
            requestsDaily: 0,
            windowDailyStart: Date.now()
        };
    }

    private static saveUsage(usage: any) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
    }
}
