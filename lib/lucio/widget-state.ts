"use client";

// Tiny module-level open/close store for the Lucio widget, so the Hero's
// "Start Planning with Lucio" CTA (a sibling of the widget in the page tree —
// pages compose <Header/><Hero/>...<Footer/><LucioMount/> flatly, with no
// shared layout to thread React context through) can open the widget without
// prop drilling or a context provider wrapping the whole page.
type Listener = () => void;

let isOpen = false;
const listeners = new Set<Listener>();

export function openLucioWidget() {
  isOpen = true;
  listeners.forEach((l) => l());
}

export function closeLucioWidget() {
  isOpen = false;
  listeners.forEach((l) => l());
}

export function toggleLucioWidget() {
  isOpen = !isOpen;
  listeners.forEach((l) => l());
}

export function subscribeLucioWidget(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLucioWidgetSnapshot() {
  return isOpen;
}

const SESSION_KEY = "lucio_session_id";

export function getLucioSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `lsess_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
