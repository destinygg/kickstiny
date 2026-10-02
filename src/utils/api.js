export async function fetchChannelInfo(username, signal) {
  const response = await fetch(
    `https://kick.com/api/v2/channels/${username}/info`,
    { signal, cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch channel info: ${response.status}`);
  }

  return await response.json();
}

export async function fetchViewerCount(livestreamId, signal) {
  const response = await fetch(
    `https://kick.com/current-viewers?ids[]=${livestreamId}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch viewer count: ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data) && data.length > 0 && data[0].viewers !== undefined) {
    return data[0].viewers;
  }

  return null;
}

export async function fetchCurrentRecording(username, livestreamId, signal) {
  const response = await fetch(
    `https://kick.com/api/v2/channels/${username}/videos`,
    // Kick caches this list for hours, including before a recording appears.
    { signal, cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(`Recording request failed: ${response.status}`);

  const videos = await response.json();
  return (
    videos.find(
      (video) => video.id === livestreamId && video.is_live && video.source,
    ) ?? null
  );
}
