"use client";

import { useEffect } from "react";

/** Registra el service worker para que la app funcione instalada (PWA). */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sin conexión a SW: la app funciona igual, solo sin modo offline.
      });
    }
  }, []);
  return null;
}
