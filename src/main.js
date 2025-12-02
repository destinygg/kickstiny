import React from "react";
import ReactDOM from "react-dom/client";
import Container from "./controls/container/Container.jsx";
import { waitForElement } from "./utils/dom.js";
import { waitForIVSCore } from "./utils/ivs.js";
import mainStyles from "./main.scss";

// Prevent multiple injections
if (window.__kickQualityExtensionInjected) {
} else {
  window.__kickQualityExtensionInjected = true;

  (async () => {
    try {
      await init();
    } catch (err) {
      console.warn("[Kickstiny] Initialization error", err);
    }
  })();

  async function init() {
    const core = await waitForIVSCore().catch((err) => {
      console.warn("[Kickstiny] Unable to locate IVS core", err);
      return null;
    });

    if (!core) {
      return;
    }

    const video = await waitForElement("video");
    if (!video) {
      console.warn("[Kickstiny] Video element not found");
      return;
    }

    document.querySelectorAll(".z-controls").forEach((element) => {
      element.remove();
    });

    injectStyles();
    renderControls(core, video.parentElement);
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = mainStyles;
    document.head.appendChild(style);
    console.debug("[Kickstiny] Injected styles");
  }

  function renderControls(core, videoContainer) {
    const root = document.createElement("div");
    root.id = "kickstiny";
    videoContainer.appendChild(root);

    const reactRoot = ReactDOM.createRoot(root);
    const reactComponent = React.createElement(Container, {
      core,
      videoContainer,
    });
    reactRoot.render(reactComponent);
    console.debug("[Kickstiny] Rendered custom controls");
  }
}
