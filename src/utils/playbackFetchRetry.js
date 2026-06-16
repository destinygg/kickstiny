const PLAYBACK_URL_PATH = /^\/api\/v2\/channels\/[^/]+\/playback-url\/?$/;
const RETRY_DELAYS = [100, 400];

function getRequestUrl(input, baseUrl) {
  try {
    const value =
      typeof input === "string" || input instanceof URL ? input : input?.url;
    return new URL(value, baseUrl);
  } catch {
    return null;
  }
}

function isPlaybackUrlRequest(input, init, baseUrl) {
  const url = getRequestUrl(input, baseUrl);
  const method = String(init?.method ?? input?.method ?? "GET").toUpperCase();

  return (
    method === "GET" &&
    url?.origin === "https://kick.com" &&
    PLAYBACK_URL_PATH.test(url.pathname)
  );
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function wait(delay, signal, setTimeoutRef, clearTimeoutRef) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const handleAbort = () => {
      clearTimeoutRef(timer);
      signal.removeEventListener("abort", handleAbort);
      reject(signal.reason);
    };
    const timer = setTimeoutRef(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, delay);

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

export function installPlaybackFetchRetry({
  windowRef = window,
  locationRef = window.location,
  delays = RETRY_DELAYS,
  setTimeoutRef = setTimeout,
  clearTimeoutRef = clearTimeout,
} = {}) {
  const originalFetch = windowRef.fetch;

  const fetchWithPlaybackRetry = async function (input, init) {
    if (!isPlaybackUrlRequest(input, init, locationRef.href)) {
      return originalFetch.call(this, input, init);
    }

    const signal = init?.signal ?? input?.signal;

    for (let attempt = 0; ; attempt++) {
      try {
        const response = await originalFetch.call(this, input, init);
        if (
          attempt >= delays.length ||
          signal?.aborted ||
          !isRetryableStatus(response.status)
        ) {
          return response;
        }
      } catch (error) {
        if (
          attempt >= delays.length ||
          signal?.aborted ||
          error?.name === "AbortError"
        ) {
          throw error;
        }
      }

      await wait(delays[attempt], signal, setTimeoutRef, clearTimeoutRef);
    }
  };

  windowRef.fetch = fetchWithPlaybackRetry;

  return {
    disconnect() {
      if (windowRef.fetch === fetchWithPlaybackRetry) {
        windowRef.fetch = originalFetch;
      }
    },
  };
}
