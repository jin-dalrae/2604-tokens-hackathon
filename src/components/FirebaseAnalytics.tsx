"use client";

import { useEffect } from "react";
import { getFirebase } from "@/lib/firebase";

// Analytics initializer — mounted once from the root layout. SSR-safe
// because it only runs in useEffect (browser only), and uses Firebase's
// `isSupported` check so it no-ops in environments without IndexedDB etc.
export function FirebaseAnalytics() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getAnalytics, isSupported } = await import("firebase/analytics");
        const ok = await isSupported();
        if (cancelled || !ok) return;
        getAnalytics(getFirebase());
      } catch (err) {
        console.warn("[firebase-analytics] skipped:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
