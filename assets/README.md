# Local visual library

- `daily-landscape.webp`: generated with the built-in imagegen tool, then resized and encoded as WebP (1100 × 733, quality 80). The source remains outside the repository; the app uses only this local derivative.
- `calm-sky.webp`: resized/encoded from the user-supplied `/Users/air/Downloads/Pics/pexels-pixabay-531767.jpg` (1100 × 734, quality 80).
- The pre-existing `mountains.svg` remains in the PWA shell.

Generation prompt:

> Use case: stylized-concept. Asset type: local scenic hero background for Better Life iPhone productivity PWA. Create a cinematic calm painterly landscape, wide 3:2 framing: warm sunrise over a tranquil blue lake and layered mountain peaks, small terrace at lower right with simple wooden desk, closed notebook and coffee, leafy branch framing upper right. Premium natural atmospheric digital painting with soft detail, navy blue shadows, muted teal water, warm peach sky. Leave upper left quiet dark blue negative space for live white app text; landscape occupies lower half and right. No people, no words, no letters, no UI, no frames, no watermarks. A beautiful usable background asset, not a screenshot.

No images are generated or fetched remotely at runtime. Optional-image precache failures do not block installation of the application shell. The hero always has a color/gradient fallback.
