# Made for More: Attendance Card Generator

A mobile-first React + Vite app for the Effective Pastors' Wives Forum Annual Conference, "Made for More", on Saturday 5th December 2026 in Abeokuta. Visitors enter their first name, upload a photo, drag/zoom to position it, generate a personalized attendance PNG, and share the image or a prewritten invite message.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

To make a production build:

```bash
npm run build
npm run preview
```

## Things to set before launch

All of these are constants at the top of `src/App.jsx`:

- `SITE_URL`: the live address of this site. While it is empty, the share message leaves out the "You can generate yours here" line.
- `REGISTER_URL`: the registration form linked from the Register now buttons and the share message.
- `EVENT_START` and `EVENT_END`: the countdown target and the time the page switches to its thank-you message.

## Template artwork

The card template is a vector SVG at `public/assets/attendance-template.svg` in the event's pink and maroon palette, with the forum logo embedded. The photo and name positions are set by `PHOTO_FRAME` and `NAME_FRAME` in `src/App.jsx` and by the percentage positions on `.poster-person` and `.poster-name` in `src/App.css`. If you replace the template, keep those aligned so the live preview and the exported PNG line up.

The logo files in `public/assets/` were cropped from the event flyer. Swap in the original logo files for a sharper result.

## Privacy

All uploaded photos are processed locally in the browser. The app does not send photos to a server or store them in a database. Native image sharing depends on browser and device support; otherwise the user can download the PNG and share it manually.

## Deploy

This is a static site, so it can be hosted anywhere that serves a Vite build. Build command `npm run build`, output directory `dist`. The site serves from the root of a domain, so no base path is needed.
