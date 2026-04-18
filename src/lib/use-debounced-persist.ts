import { useEffect, useRef } from "react";

/**
 * Persist `state` to localStorage asynchronously, debounced.
 * Keeps writes off the critical render path so typing / sliders don't stutter.
 */
export function useDebouncedPersist<T>(
  key: string,
  state: T,
  ready: boolean,
  delayMs = 150,
) {
  const latestRef = useRef(state);
  latestRef.current = state;

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(latestRef.current));
      } catch {
        /* storage full or unavailable — ignore */
      }
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [key, state, ready, delayMs]);

  // Flush on unload so in-flight edits aren't lost.
  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      try {
        localStorage.setItem(key, JSON.stringify(latestRef.current));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [key, ready]);
}
