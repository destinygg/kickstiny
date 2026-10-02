import { useState, useEffect } from "react";
import { fetchChannelInfo, fetchViewerCount } from "../../utils/api.js";
import { formatUptime, extractUsernameFromUrl } from "../../utils/format.js";

export function useChannelInfo() {
  const [username, setUsername] = useState(null);
  const [viewerCount, setViewerCount] = useState(null);
  const [uptime, setUptime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [livestreamId, setLivestreamId] = useState(null);

  useEffect(() => {
    const extractedUsername = extractUsernameFromUrl(window.location.href);
    if (!extractedUsername) {
      return;
    }

    const abort = new AbortController();
    let retry;
    let viewerCountInterval;

    const loadChannelInfo = async () => {
      try {
        const data = await fetchChannelInfo(extractedUsername, abort.signal);
        if (abort.signal.aborted) return;

        if (data.user?.username) {
          setUsername(data.user.username);
        }

        const livestreamId = data.livestream?.id;
        setLivestreamId(livestreamId ?? null);
        if (!livestreamId) {
          retry = setTimeout(loadChannelInfo, 60000);
          return;
        }
        if (data.livestream.viewer_count !== undefined) {
          setViewerCount(data.livestream.viewer_count);
        }
        if (data.livestream.start_time) {
          setStartTime(data.livestream.start_time);
        }

        const updateViewerCount = async () => {
          try {
            const viewers = await fetchViewerCount(livestreamId, abort.signal);
            if (!abort.signal.aborted && viewers !== null) {
              setViewerCount(viewers);
            }
          } catch (error) {
            if (!abort.signal.aborted) {
              console.error("[Kickstiny] Error fetching viewer count", error);
            }
          }
        };

        updateViewerCount();

        viewerCountInterval = setInterval(updateViewerCount, 60000);
      } catch (error) {
        if (!abort.signal.aborted) {
          console.error("[Kickstiny] Error fetching channel info", error);
          retry = setTimeout(loadChannelInfo, 60000);
        }
      }
    };

    loadChannelInfo();

    return () => {
      abort.abort();
      clearTimeout(retry);
      clearInterval(viewerCountInterval);
    };
  }, []);

  useEffect(() => {
    if (!startTime) return;

    const updateUptime = () => setUptime(formatUptime(startTime));
    updateUptime();
    const uptimeInterval = setInterval(updateUptime, 1000);
    return () => clearInterval(uptimeInterval);
  }, [startTime]);

  return { username, viewerCount, uptime, livestreamId };
}
