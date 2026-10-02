export function extractUsernameFromUrl(url) {
  // Extract username from URL: https://player.kick.com/<name>
  const match = url.match(/player\.kick\.com\/([^\/\?#]+)/);

  if (!match) {
    console.warn("[Kickstiny] Could not extract username from URL");
    return null;
  }

  return match[1];
}

export function formatPlaybackRate(rate) {
  return rate === 1 ? "Normal" : `${rate}×`;
}

export function formatUptime(startTime) {
  if (!startTime) return null;

  try {
    // Convert "YYYY-MM-DD HH:mm:ss" format to ISO format for reliable parsing
    const isoTime = startTime.replace(" ", "T");
    const start = new Date(isoTime + "Z");

    if (isNaN(start.getTime())) {
      console.warn("[Kickstiny] Invalid start time format", startTime);
      return null;
    }

    const now = new Date();
    const diffMs = now - start;

    if (diffMs < 0) {
      return null;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format as h:mm:ss (e.g., "2:34:15")
    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  } catch (error) {
    console.error("[Kickstiny] Error formatting uptime", error, startTime);
    return null;
  }
}
