import api from "./api";

export const clearApplicationCache = async () => {
  await api.post("/api/inventory/cache/clear/");
};

export const clearFrontendCaches = async () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.clear();
  } catch {
    // Ignore client storage failures.
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // Ignore client storage failures.
  }

  if ("caches" in window) {
    try {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    } catch {
      // Ignore Cache API failures.
    }
  }
};
