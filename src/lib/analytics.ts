import { track as vercelTrack } from "@vercel/analytics";

/** Analytics only run in production builds. */
export const analyticsEnabled = import.meta.env.PROD;

/** GA4 measurement IDs are publishable, so a hardcoded fallback is safe. */
const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as
    | string
    | undefined) || "G-06MKLBCBC5";

type Props = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Loads GA4 once, only when a measurement ID is configured. */
export const initGoogleAnalytics = () => {
  if (!analyticsEnabled || !GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined" || window.gtag) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag("js", new Date());
  // Vercel Analytics + our router hook handle SPA page views, so disable
  // gtag's automatic page_view to avoid duplicates.
  gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
};

/** Sends a page view to GA4 (Vercel Analytics tracks routes automatically). */
export const trackPageView = (path: string) => {
  if (!analyticsEnabled) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const ANALYTICS_EVENTS = {
  bookDemo: "book_demo",
  startFreeTrial: "start_free_trial",
  courseViewed: "course_viewed",
  courseEnrolled: "course_enrolled",
  pricingViewed: "pricing_viewed",
  contactFormSubmitted: "contact_form_submitted",
  academySearch: "academy_search",
  atsResumeUploaded: "ats_resume_uploaded",
  atsScoreGenerated: "ats_score_generated",
  certificateVerified: "certificate_verified",
  userSignup: "user_signup",
  userLogin: "user_login",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Fires a custom event to Vercel Analytics and GA4 (when configured). */
export const trackEvent = (event: AnalyticsEvent, props?: Props) => {
  if (!analyticsEnabled) return;
  try {
    vercelTrack(event, props ?? undefined);
    window.gtag?.("event", event, props ?? {});
  } catch {
    // Never let analytics break the app.
  }
};
