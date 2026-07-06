import { useState, useCallback, useEffect } from "react";

const fullscreenChangeEvents = [
  "fullscreenchange",
  "webkitfullscreenchange",
  "mozfullscreenchange",
  "MSFullscreenChange",
];

const nativeVideoFullscreenEvents = [
  "webkitbeginfullscreen",
  "webkitendfullscreen",
  "webkitpresentationmodechanged",
];

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

function isNativeVideoFullscreen(videoElement) {
  return !!(
    videoElement &&
    (videoElement.webkitDisplayingFullscreen ||
      videoElement.webkitPresentationMode === "fullscreen")
  );
}

function supportsNativeVideoFullscreen(videoElement) {
  return (
    typeof videoElement.webkitEnterFullscreen === "function" &&
    videoElement.webkitSupportsFullscreen !== false
  );
}

function supportsNativeVideoPresentationMode(
  videoElement,
  mode,
  failedAttempts,
) {
  if (typeof videoElement.webkitSetPresentationMode !== "function") {
    return false;
  }

  if (typeof videoElement.webkitSupportsPresentationMode !== "function") {
    return true;
  }

  try {
    return videoElement.webkitSupportsPresentationMode.call(videoElement, mode);
  } catch (err) {
    failedAttempts.push({
      method: `webkitSupportsPresentationMode("${mode}")`,
      err,
    });
    return false;
  }
}

function tryNativeVideoFullscreen(method, enterFullscreen) {
  try {
    enterFullscreen();
    return null;
  } catch (err) {
    return { method, err };
  }
}

function enterNativeVideoFullscreen(videoElement) {
  if (!videoElement) {
    return false;
  }

  const failedAttempts = [];

  if (supportsNativeVideoFullscreen(videoElement)) {
    const failure = tryNativeVideoFullscreen("webkitEnterFullscreen", () => {
      videoElement.webkitEnterFullscreen();
    });

    if (!failure) {
      return true;
    }

    failedAttempts.push(failure);
  }

  if (
    supportsNativeVideoPresentationMode(
      videoElement,
      "fullscreen",
      failedAttempts,
    )
  ) {
    const failure = tryNativeVideoFullscreen(
      'webkitSetPresentationMode("fullscreen")',
      () => {
        videoElement.webkitSetPresentationMode("fullscreen");
      },
    );

    if (!failure) {
      return true;
    }

    failedAttempts.push(failure);
  }

  if (failedAttempts.length) {
    console.warn("[Kickstiny] Native video fullscreen failed", failedAttempts);
  }

  return false;
}

function exitNativeVideoFullscreen(videoElement) {
  try {
    if (typeof videoElement.webkitExitFullscreen === "function") {
      videoElement.webkitExitFullscreen();
      return;
    }

    if (typeof videoElement.webkitSetPresentationMode === "function") {
      videoElement.webkitSetPresentationMode("inline");
    }
  } catch (err) {
    console.warn("[Kickstiny] Native video fullscreen exit failed", err);
  }
}

function getElementFullscreenRequest(element) {
  if (!element) {
    return null;
  }

  return (
    (typeof element.requestFullscreen === "function" &&
      element.requestFullscreen) ||
    (typeof element.webkitRequestFullscreen === "function" &&
      element.webkitRequestFullscreen) ||
    (typeof element.mozRequestFullScreen === "function" &&
      element.mozRequestFullScreen) ||
    (typeof element.msRequestFullscreen === "function" &&
      element.msRequestFullscreen) ||
    null
  );
}

export function useFullscreenControl(container, videoElement) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const updateFullscreenState = useCallback(() => {
    const fullscreenElement = getFullscreenElement();
    setIsFullscreen(
      fullscreenElement === container ||
        fullscreenElement === videoElement ||
        isNativeVideoFullscreen(videoElement),
    );
  }, [container, videoElement]);

  const enterNativeVideoFullscreenOrUpdateState = useCallback(() => {
    if (!enterNativeVideoFullscreen(videoElement)) {
      updateFullscreenState();
    }
  }, [updateFullscreenState, videoElement]);

  const handleFullscreenToggle = useCallback(() => {
    if (getFullscreenElement()) {
      const exitFullscreen =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;

      if (exitFullscreen) {
        try {
          const result = exitFullscreen.call(document);
          result?.catch?.((err) => {
            console.warn("[Kickstiny] Fullscreen exit failed", err);
            updateFullscreenState();
          });
        } catch (err) {
          console.warn("[Kickstiny] Fullscreen exit failed", err);
          updateFullscreenState();
        }
      }

      return;
    }

    if (isNativeVideoFullscreen(videoElement)) {
      exitNativeVideoFullscreen(videoElement);
      return;
    }

    const requestFullscreen = getElementFullscreenRequest(container);

    if (!requestFullscreen) {
      enterNativeVideoFullscreenOrUpdateState();
      return;
    }

    try {
      const result = requestFullscreen.call(container);
      result?.catch?.((err) => {
        console.warn("[Kickstiny] Element fullscreen failed", err);
        enterNativeVideoFullscreenOrUpdateState();
      });
    } catch (err) {
      console.warn("[Kickstiny] Element fullscreen failed", err);
      enterNativeVideoFullscreenOrUpdateState();
    }
  }, [
    container,
    enterNativeVideoFullscreenOrUpdateState,
    updateFullscreenState,
    videoElement,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => updateFullscreenState();

    fullscreenChangeEvents.forEach((eventName) => {
      document.addEventListener(eventName, handleFullscreenChange);
    });
    nativeVideoFullscreenEvents.forEach((eventName) => {
      videoElement?.addEventListener(eventName, handleFullscreenChange);
    });
    updateFullscreenState();

    return () => {
      fullscreenChangeEvents.forEach((eventName) => {
        document.removeEventListener(eventName, handleFullscreenChange);
      });
      nativeVideoFullscreenEvents.forEach((eventName) => {
        videoElement?.removeEventListener(eventName, handleFullscreenChange);
      });
    };
  }, [updateFullscreenState, videoElement]);

  return {
    isFullscreen,
    handleFullscreenToggle,
  };
}
