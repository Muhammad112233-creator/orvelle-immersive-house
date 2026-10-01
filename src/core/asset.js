/* ---------------------------------------------------------------------------
   One place that knows where the static files live.

   Everything under public/ is referenced through here rather than with a
   leading slash, so the built site survives being dropped into a GitHub Pages
   project subfolder (/my-repo/) exactly as well as it survives a domain root.
   BASE_URL is whatever `base` in vite.config.js says — './' by default.

   Templates must use :src="asset('images/…')" rather than src="images/…":
   a literal src in a template is treated by the bundler as an import request
   and it will try — and fail — to resolve it out of src/.
   --------------------------------------------------------------------------- */

const BASE = import.meta.env.BASE_URL || './'

export function asset(path) {
  return BASE + String(path).replace(/^\/+/, '')
}

export default asset
