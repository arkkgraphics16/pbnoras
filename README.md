# PBN Kron

PBN Kron is a lightweight goals tracker inspired by Akrondis. It is a single-page application built with Vite and React, backed by Firebase Authentication and Cloud Firestore. The app is tuned for Messenger and other in-app web views using local persistence with a session fallback.

## Getting started

### Prerequisites
- Node.js 18+
- npm 9+
- A Firebase project with Firestore located in **asia-southeast1**

### Installation

```bash
npm install
```

### Environment variables

Create a `.env` file based on `.env.example` and provide the Firebase web configuration values. All variables must be prefixed with `VITE_` so that Vite can expose them to the client.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Development server

```bash
npm run dev
```

This runs the Vite development server with hot reloading.

### Production build

```bash
npm run build
```

Use `npm run preview` to inspect the production build locally.

### Firebase setup

1. Enable **Email/Password** authentication in Firebase Auth.
2. Create a Firestore database in the **asia-southeast1** region.
3. Deploy the security rules contained in [`firestore.rules`](./firestore.rules).
4. If Firestore suggests composite indexes for queries (none are required for the shipped queries), create them and add notes here. *(No indexes were required during development.)*

### Vercel deployment

Deploy the app on Vercel using the default Vite preset. Add the `VITE_FIREBASE_*` variables as Environment Variables in the project settings. Vercel automatically injects them for both build and runtime.

If you are serving the SPA behind rewrites, add [`vercel.json`](./vercel.json) to ensure client-side routing always resolves to `index.html`.

### Data model summary

- `users/{uid}`: `{ email, username, createdAt, updatedAt }`
- `users/{uid}/goals/{goalId}`: `{ text, type, deadline, status, public, createdAt, updatedAt }`
- `public_goals/{goalId}`: `{ authorUid, authorName, text, type, deadline, status, createdAt }`

Whenever a goal is flagged as public, the document is mirrored in `public_goals`. Toggling the goal to private removes the public document.

## License

[MIT](./LICENSE)
