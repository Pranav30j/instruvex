import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { analyticsEnabled, initGoogleAnalytics, trackPageView } from "@/lib/analytics";

/**
 * Mounts Vercel Analytics + Speed Insights and forwards SPA route changes
 * to GA4. Renders nothing outside production.
 */
const AnalyticsProvider = () => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return; // avoid duplicate page views
    lastPath.current = path;
    trackPageView(path);
  }, [location.pathname, location.search]);

  if (!analyticsEnabled) return null;

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
};

export default AnalyticsProvider;
