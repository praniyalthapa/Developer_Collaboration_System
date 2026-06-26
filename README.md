# DevCollab

A developer collaboration platform: discover developers by skill, connect, chat
in real time, jump on a video call with screen sharing, and pair-program in a
shared multi-language code editor.

This repository is a full **TypeScript** rewrite of the original JavaScript
project, built as an npm-workspaces monorepo with an Express/MongoDB API and a
React/Vite client.

<!-- Replace OWNER/REPO once pushed to GitHub to enable the live build badge. -->
![CI](https://img.shields.io/badge/CI-type--check%20%7C%20lint%20%7C%20test%20%7C%20build-informational)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Node](https://img.shields.io/badge/Node-20-339933)
![React](https://img.shields.io/badge/React-19-61dafb)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47a248)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Skill-based matching** — a swipeable discovery deck (drag, keyboard, or
  buttons) ranks developers by shared skills and hides anyone you already have a
  request with.
- **Connections, requests, and sent** — an inbox-style network with accept /
  decline, status tracking, and search.
- **Real-time chat** — a two-pane messaging layout (conversation list plus a
  docked chat panel) powered by Socket.IO, with unread counts and history.
- **Online presence** — live online/offline indicators across connections and
  chat, driven by socket presence tracking.
- **Video calls and screen sharing** — WebRTC peer-to-peer audio/video with
  screen share, available both inside a chat and inside a code session.
- **Collaborative code editor** — a Monaco editor with real-time code and
  language sync between participants.
- **Multi-language execution** — JavaScript runs in a sandboxed browser worker;
  TypeScript, Python, Java, and Go run server-side with a timeout.
- **Admin dashboard** — role-based access control with platform stats and user
  management (search, role changes, deletion).
- **Auth** — JWT in an http-only cookie, with optional Google OAuth.
- **Polished UI** — a responsive dashboard shell (sidebar plus mobile bottom
  nav), light and dark themes, profile editor with photo upload and cropping.

## Tech stack

| Area           | Technologies                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| Backend        | Node 20, Express 4, Mongoose 8, Zod, JSON Web Tokens, bcryptjs, Socket.IO    |
| Auth / uploads | Passport (Google OAuth), Multer, Nodemailer, node-cron                       |
| Frontend       | React 19, Vite 6, TypeScript, Redux Toolkit, React Router 7, Axios           |
| Realtime / UI  | Socket.IO client, WebRTC, Monaco editor, Tailwind CSS + DaisyUI              |
| Tooling        | ESLint (typescript-eslint), Vitest, GitHub Actions, Docker, nginx            |

## Architecture

Requests flow through clearly separated layers:

```
route -> middleware (authenticate / authorize) -> controller (Zod validation)
      -> service (business logic) -> model
```

Errors are thrown as a typed `ApiError` (or validation errors) and turned into
HTTP responses by a single error handler. Real-time chat, presence, code
sessions, and WebRTC signaling run over a typed Socket.IO gateway.

```
refactor/
  apps/
    backend/                 Express + Mongoose API (TypeScript)
      src/
        config/              env validation, database, passport
        models/              Mongoose models and interfaces
        validators/          Zod request schemas (+ unit tests)
        services/            business logic (auth, profile, chat, match, admin, execute)
        controllers/         HTTP handlers
        routes/              route definitions
        middlewares/         authenticate, role authorize, error, upload
        socket/              chat, presence, code-session, and WebRTC signaling
        cron/                scheduled jobs
        seed/                admin + demo account and relationship seeding
        utils/               jwt, password, cookies, mailer, logger, errors (+ tests)
        app.ts / server.ts   app factory and bootstrap
    frontend/                React + Vite client (TypeScript)
      src/
        api/                 typed API client modules
        app/                 Redux store and typed hooks
        features/            Redux slices
        context/             auth + presence providers
        hooks/               useCall (WebRTC)
        components/          reusable UI (sidebar, chat, swipe deck, call panel, ...)
        pages/               route screens
        lib/                 api client, socket, runners, theme, formatting
  .github/workflows/ci.yml   type-check, lint, test, build
  docker-compose.yml
```

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for the containerized path)
- For local multi-language code execution: `python3`, `java` (11+), and `go` on
  your PATH (JavaScript and TypeScript work without them)

## Quick start with Docker

```bash
cd refactor
JWT_SECRET="$(openssl rand -hex 32)" docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:7777/api
- Health: http://localhost:7777/healthz

The backend seeds the database on startup (`RUN_SEED=true` in
`docker-compose.yml`).

## Local development

```bash
cd refactor
npm install
cp apps/backend/.env.example apps/backend/.env   # set JWT_SECRET (min 16 chars)
npm run seed
npm run dev
```

- Frontend dev server: http://localhost:5173 (proxies `/api` and `/socket.io`)
- API: http://localhost:7777

To run the API on a non-default port, set `PORT` in `.env` and point the Vite
proxy at it with `BACKEND_PROXY=http://localhost:<port> npm run dev:frontend`.

## Demo accounts

Seeding creates an administrator, several demo developers, and example
connections, a pending request, and a chat so every screen is populated. The
login page lists them for one-click sign-in.

| Role  | Email                | Password    |
| ----- | -------------------- | ----------- |
| Admin | admin@devcollab.dev  | Admin@12345 |
| User  | maya@devcollab.dev   | Demo@12345  |
| User  | liam@devcollab.dev   | Demo@12345  |
| User  | sofia@devcollab.dev  | Demo@12345  |
| User  | noah@devcollab.dev   | Demo@12345  |
| User  | aria@devcollab.dev   | Demo@12345  |
| User  | ethan@devcollab.dev  | Demo@12345  |

Open two browsers signed in as two connected accounts to see real-time chat,
presence, and video calls in action.

## Scripts (run from the repo root)

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Run backend and frontend in watch mode   |
| `npm run build`     | Build both applications                  |
| `npm run typecheck` | Type-check both applications             |
| `npm run lint`      | Lint both applications                   |
| `npm test`          | Run the backend test suite (Vitest)      |
| `npm run seed`      | Seed admin, demo accounts, and demo data |

## Testing

Unit tests (Vitest) cover the pure logic that does not need a database — JWT
sign/verify, password hashing, room hashing, and the Zod validation schemas.

```bash
npm test
```

CI runs type-check, lint, tests, and build on every push and pull request
(`.github/workflows/ci.yml`).

## Environment variables (backend)

| Variable                          | Required | Default                               | Description                                |
| --------------------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `PORT` / `HOST`                   | no       | `7777` / `0.0.0.0`                     | Server bind                                |
| `NODE_ENV`                        | no       | `development`                         | Environment mode                           |
| `MONGO_URI`                       | no       | `mongodb://localhost:27017/devcollab` | MongoDB connection string                  |
| `JWT_SECRET`                      | yes      | none                                  | JWT signing secret (min 16 characters)     |
| `CORS_ORIGIN`                     | no       | `http://localhost:5173`               | Comma-separated allowed origins            |
| `WEB_APP_URL` / `BACKEND_BASE_URL`| no       | localhost defaults                    | URLs used for OAuth redirects              |
| `RUN_SEED`                        | no       | `false`                               | Seed on startup                            |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`  | no       | `admin@devcollab.dev` / `Admin@12345` | Seeded admin credentials                   |
| `CODE_EXECUTION_ENABLED`          | no       | `true`                                | Enable server-side code execution          |
| `GOOGLE_CLIENT_ID` / `..._SECRET` | no       | none                                  | Enable Google OAuth when both are set      |
| `SMTP_HOST` / `SMTP_USER` / `..._PASS` | no  | none                                  | Enable transactional email when all set    |

Optional features degrade gracefully when unconfigured: Google OAuth routes
return 503, and email is logged instead of sent.

## API overview

All routes are served under `/api`. Authenticated routes require the JWT cookie;
admin routes additionally require the `admin` role.

| Method | Path                                  | Auth   | Description                          |
| ------ | ------------------------------------- | ------ | ------------------------------------ |
| POST   | `/signup` `/login` `/logout`          | public | Authentication                       |
| GET    | `/auth/google`                        | public | Google OAuth (if configured)         |
| GET    | `/profile/view`                       | user   | Current profile                      |
| PATCH  | `/profile/edit`                       | user   | Update profile                       |
| DELETE | `/profile/delete`                     | user   | Delete account (cascading)           |
| POST   | `/upload/profile-photo`               | user   | Upload a profile photo               |
| GET    | `/feed`                               | user   | Paginated discovery feed             |
| GET    | `/smart-matches`                      | user   | Skill-ranked matches                 |
| GET    | `/user/connections`                   | user   | Accepted connections                 |
| GET    | `/user/requests/received` `/sent`     | user   | Received / sent requests             |
| POST   | `/request/send/:status/:toUserId`     | user   | Send a request                       |
| POST   | `/request/review/:status/:requestId`  | user   | Accept or reject a request           |
| DELETE | `/request/cancel/:requestId`          | user   | Cancel a sent request                |
| GET    | `/chat/:targetUserId` , `/chats`      | user   | Fetch a chat / chat summaries        |
| POST   | `/code-session/create`                | user   | Create or resume a code session      |
| GET    | `/code-session/:sessionId`            | user   | Fetch a code session                 |
| POST   | `/execute`                            | user   | Run code (server-side languages)     |
| GET    | `/admin/stats` `/admin/users`         | admin  | Platform stats / user list           |
| PATCH  | `/admin/users/:userId/role`           | admin  | Change a user role                   |
| DELETE | `/admin/users/:userId`                | admin  | Delete a user                        |

### Real-time events (Socket.IO)

- **Chat**: `joinChat`, `sendMessage` → `messageReceived`
- **Presence**: `presenceJoin` → `presenceState`, `presenceOnline`, `presenceOffline`
- **Code session**: `joinCodeSession`, `codeChange`/`languageChange` → `codeUpdate`/`languageUpdate`, plus typing and participant events
- **WebRTC signaling**: `callJoin`/`callLeave`, `callSignalOffer`/`Answer`/`Ice` relayed as `callOffer`/`callAnswer`/`callIce`

## Security notes

- Passwords are hashed with bcrypt and stored with `select: false`.
- The server refuses to start without a strong `JWT_SECRET`.
- Auth endpoints are rate-limited; Helmet sets security headers.
- The JavaScript runner uses a sandboxed Web Worker (no DOM, with a timeout).
- Server-side code execution (`/execute`) runs untrusted code in installed
  runtimes with a 10s timeout, output cap, and temp-dir isolation. It is real
  remote-code-execution surface: run the backend in an isolated container in
  production, or set `CODE_EXECUTION_ENABLED=false` to disable it.

## Roadmap

- TURN server configuration for calls across restrictive networks
- Self-hosted Piston sidecar for fully sandboxed multi-language execution
- Email verification and password reset flows
- Push / in-app notifications for new requests and messages

## License

MIT
