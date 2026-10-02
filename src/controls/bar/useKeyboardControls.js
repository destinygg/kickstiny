import { useEffect } from "react";

export function useKeyboardControls({
  onPlayPause,
  onMuteToggle,
  onFullscreenToggle,
  container,
  showControls,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;

      // Prevent default behavior for these keys
      const key = event.key.toLowerCase();

      switch (key) {
        case " ": // Spacebar
          event.preventDefault();
          showControls();
          onPlayPause();
          break;
        case "m":
          event.preventDefault();
          showControls();
          onMuteToggle();
          break;
        case "f":
          event.preventDefault();
          showControls();
          onFullscreenToggle();
          break;
        default:
          break;
      }
    };

    // Listen on document so keyboard shortcuts work anywhere on the page
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [container, onPlayPause, onMuteToggle, onFullscreenToggle, showControls]);
}
