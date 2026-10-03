import webpush from "web-push";
import { VAPID_PUBLIC_KEY } from "./vapid-client";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "aC2Kl8HToHvb3QkvhJ2H_fILBJwChYSbyxIqh29XJxk";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@gymlo.app";

// Initialize web-push configuration once on server
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export { webpush, VAPID_PUBLIC_KEY };
