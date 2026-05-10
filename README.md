# DAYSU Desktop

DAYSU is packaged as a lightweight Electron desktop app that loads the local `index.html` experience in a native window.

## Development

Install dependencies:

```sh
npm install
```

Run the desktop app:

```sh
npm start
```

Check JavaScript syntax:

```sh
npm run check
```

## Project structure

- `index.html` — the DAYSU desktop UI.
- `main.js` — Electron main process and native window configuration.
- `preload.js` — safe browser context bridge for desktop runtime metadata.
