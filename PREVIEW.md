## 3. Run it locally (the development server)

This is the proper way to work on the site: changes appear in the browser the
instant you save, with no build step and no commit.

### One-time setup

1. **Install Node.js 20 or newer** from <https://nodejs.org> (the LTS download).
   Check it worked by opening a terminal and running:

   ```bash
   node -v
   ```

   You should see `v20.x.x` or higher.

2. **Get the project onto your computer.** On the repository home page, click
   the green **Code** button → **Download ZIP**, then unzip it.

3. **Open a terminal in that folder.**
   - _macOS_: right-click the folder → Services → **New Terminal at Folder**.
   - _Windows_: open the folder in File Explorer, click the address bar, type
     `cmd`, and press Enter.

4. **Install the dependencies** (once; takes a minute):
   ```bash
   npm install
   ```

### Every time after that

```bash
npm run dev
```

You will see:

```
VITE v8.3.2  ready in 389 ms

➜  Local:   http://localhost:5173/
```

Open **<http://localhost:5173/>**. Edit any file in `src/`, save, and the
browser updates immediately — usually without even losing your place in the
experience.

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> in the terminal to stop the server.

### Viewing it on your phone

Add `--host` to expose the server to your local network:

```bash
npm run dev -- --host
```

Vite then prints a second address, something like `http://192.168.1.24:5173/`.
Type that into your phone's browser, with the phone on the same Wi-Fi. This is
the only practical way to test the touch interactions and the mobile hotspot
positions.

### Development shortcuts

While the site is running locally, the browser console exposes a small debug
object so you do not have to replay the whole experience to reach the end:

```js
$game.complete(); // write every journal line and unlock the end page
```

---

## 4. Preview the production build

The development server is not identical to the deployed site: it does not
minify, and it serves modules individually. Before publishing something
important, check the real build.

```bash
npm run build     # compiles into dist/
npm run preview   # serves dist/ at http://localhost:4173/
```

`npm run preview` is the closest thing to the live site you can get on your own
machine — same minified bundles, same asset paths, same chunk loading.

> **Do not open `dist/index.html` by double-clicking it.** Opening it as a
> `file://` URL makes the browser block the JavaScript modules for security
> reasons and you will get a blank page. It is not a broken build. Always serve
> it, with `npm run preview`.

The contents of `dist/` are exactly what GitHub Actions uploads, so if it works
here, it will work live.

---

## Quick reference

| Command                 | What it does                         | Address                 |
| ----------------------- | ------------------------------------ | ----------------------- |
| `npm install`           | Installs dependencies (once)         | —                       |
| `npm run dev`           | Development server, live reload      | http://localhost:5173   |
| `npm run dev -- --host` | Same, reachable from your phone      | printed in the terminal |
| `npm run build`         | Production build into `dist/`        | —                       |
| `npm run preview`       | Serves the production build          | http://localhost:4173   |
| `npm run assets`        | Re-runs the product cut-out pipeline | —                       |

---

## 5. The automated smoke test (optional)

`tools/smoke.mjs` drives a real browser through the whole experience and fails
on any console error, page error or failed request. It caught a shader bug and
a camera framing bug during development.

It needs Playwright, which is deliberately **not** a dependency of this project
— installing it would slow every CI build down for no benefit. Add it only when
you want to run the check:

```bash
npm install --no-save playwright
npx playwright install chromium
npm run dev          # in one terminal
node tools/smoke.mjs # in another
```

It writes screenshots to `tools/shot-*.png` (gitignored) so you can eyeball
each room and interaction without clicking through by hand.
