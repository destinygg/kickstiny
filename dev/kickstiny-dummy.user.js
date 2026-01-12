// ==UserScript==
// @name         Kickstiny Dummy Script
// @namespace    https://www.destiny.gg
// @version      0.0.1
// @description  Replaces the controls in the Kick embedded player with custom controls that offer a volume slider, quality selector, and more.
// @author       Destinygg
// @match        https://player.kick.com/*
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const url = "http://localhost:6868/index.js?t=" + new Date().getTime();

  GM_xmlhttpRequest({
    method: "GET",
    url: url,
    onload: function (response) {
      if (response.status === 200) {
        // Inject the script content directly
        const script = document.createElement("script");
        script.textContent = response.responseText;
        document.head.appendChild(script);
      } else {
        console.error(
          "Failed to load script:",
          response.status,
          response.statusText,
        );
      }
    },
    onerror: function (error) {
      console.error("Error loading script from dev server:", error);
      console.error("Make sure the dev server is running: npm run dev");
    },
  });
})();
