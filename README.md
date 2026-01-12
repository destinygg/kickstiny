```
Baltazar_: Kick embed so fucken dog shit I'm watching XQC on Twitch instead
tdnPanda: Memegasm thank you for 144p kick embed
Kaib_1: > i love when the kick embed is stuck at 480p FeelsOkayMan
irwin08: REE my kick embed keeps freezing
psyDavid: NAHH with that kick embed bro streaming in 360p
flashbang: i cant even read the tweet REE fuck this kick embed
izuul: >kick embed still dogshit
fused_atoms_: god this kick embed is truly fucking awful, it's actually just bad
Got3nks: >havent put my contact lenses, cant tell if i cant see because im blind or the retard kick embed is in 480p
4amaronii: why doesn't kick embed have a volume mixer Painstiny
Thrash95: Ningguanq the kick embed on mobile has a giant overlay with the stream info Smadge
Pito: why is the kick embed always so shit REE
FooR: THIS FUCKING DOG SHIT KICK EMBED IS MAKING ME SCHIZO
Jegon: WTF IS THIS KICK EMBED BRO
```

# Kickstiny: Enhanced Kick Embedded Player

A userscript that replaces the controls in the Kick embedded player with custom controls that offer a volume slider, quality selector, and more.

![Controls Bar](img/controls-bar.png)

## How to Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your web browser
2. Click [here](https://r2cdn.destiny.gg/kickstiny/kickstiny.user.js) to open the userscript in the Tampermonkey dashboard, which will prompt you to install
3. Click "Install"

> Note: Chrome and Edge users must enable **both** "Developer Mode" on the extensions page and the "Allow User Scripts" Tampermonkey setting for userscripts to work. See the [Tampermonkey FAQ](https://www.tampermonkey.net/faq.php?locale=en#Q209) for more details/guidance.

## Development

The development setup works around browser limitations: importing the compiled userscript from a file URL works in Chrome, but isn't allowed in Firefox. To support both browsers, we run a simple HTTP server that serves the file on localhost and use a dummy userscript that loads the real userscript from localhost on page load. The build process auto-compiles on change, and changes are reflected in the browser on reload.

1. Install dependencies

   ```bash
   npm ci
   ```

2. Start the dev server

   ```bash
   npm run dev
   ```

   > Note: This runs esbuild in watch mode and the HTTP server concurrently.

3. Install the dummy Tampermonkey script, `dev/kickstiny-dummy.user.js`

4. Navigate to any `https://player.kick.com/*` URL
