import * as esbuild from "esbuild";
import * as sass from "sass";
import { resolve } from "path";
import packageJson from "./package.json" with { type: "json" };

const env = process.argv.includes("--prod") ? "prod" : "dev";
const watch = process.argv.includes("--watch") ? true : false;

const userscriptHeader = `// ==UserScript==
// @name         Kickstiny: Enhanced Kick Embedded Player
// @namespace    https://www.destiny.gg
// @version      ${packageJson.version}
// @description  Replaces the controls in the Kick embedded player with custom controls that offer a volume slider, quality selector, and more.
// @author       Destinygg
// @match        https://player.kick.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://r2cdn.destiny.gg/kickstiny/kickstiny.user.js
// @downloadURL  https://r2cdn.destiny.gg/kickstiny/kickstiny.user.js
// @supportURL   https://github.com/destinygg/kickstiny
// @tag          kick
// @tag          dgg
// @tag          destinygg
// @tag          bigscreen
// ==/UserScript==

`;

const buildOptions = {
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "iife",
  outfile: "kickstiny.user.js",
  banner: {
    js: userscriptHeader,
  },
  target: ["es2020"],
  platform: "browser",
  sourcemap: false,
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  loader: {
    ".jsx": "jsx",
    ".css": "text",
    ".scss": "text",
    ".sass": "text",
  },
  plugins: [
    {
      name: "sass",
      setup(build) {
        // Handle all SCSS files - compile to CSS text
        build.onLoad({ filter: /\.(scss|sass)$/ }, (args) => {
          const result = sass.compile(args.path, {
            style: env === "prod" ? "compressed" : "expanded",
            loadPaths: [resolve(process.cwd(), "node_modules"), process.cwd()],
            importers: [
              {
                findFileUrl(url) {
                  // Handle ~ prefix for node_modules packages
                  if (url.startsWith("~")) {
                    const pkgPath = url.substring(1);
                    const fullPath = resolve(
                      process.cwd(),
                      "node_modules",
                      pkgPath,
                      "lib/index.scss",
                    );
                    return new URL(`file://${fullPath}`);
                  }
                  return null;
                },
              },
            ],
          });

          // Convert loadedUrls to file paths for watch mode
          const watchFiles = result.loadedUrls
            .map((url) => {
              // Convert file:// URLs to file paths
              if (url.protocol === "file:") {
                // Handle both Unix (/path) and Windows (C:/path) paths
                let path = url.pathname;
                // On Windows, pathname starts with /C:/, remove leading /
                if (process.platform === "win32" && path.match(/^\/[A-Z]:/)) {
                  path = path.substring(1);
                }
                return decodeURIComponent(path);
              }
              return url.href;
            })
            .filter(Boolean);

          return {
            contents: result.css,
            loader: "text",
            watchFiles: watchFiles.length > 0 ? watchFiles : [args.path],
          };
        });
      },
    },
    {
      name: "build-notifier",
      setup(build) {
        build.onEnd(() => {
          if (watch) {
            console.log("✓ Build successful");
          }
        });
      },
    },
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify(env),
  },
  mainFields: ["browser", "module", "main"],
  conditions: ["production", "default"],
};

if (env === "prod") {
  Object.assign(buildOptions, {
    minify: true,
    pure: ["console.debug"], // Remove all `console.debug()` calls in production builds.
  });
}

async function build() {
  try {
    if (watch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log("Watching for changes...");
    } else {
      await esbuild.build(buildOptions);
      console.log("Build complete!");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
