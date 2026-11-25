# Sparqly Frontend: Production Audit

Audit of the Next.js frontend (`/home/shami/Documents/Code/Sparqly`) against the backend on branch `fix/production-hardening`. Every feature flow was traced from the UI through the API call to what the backend actually accepts and returns.

Severity: **P0** = broken or blocks release · **P1** = wrong behaviour users will hit · **P2** = quality, polish or cleanup.

## Status (25 Nov 2026)

The frontend was rebuilt on branch `feat/linear-redesign` with the Linear-style design in section 6. The backend changes are on `fix/production-hardening`. `tsc`, `next lint` and `next build` pass on the frontend. `tsc`, lint and the unit tests pass on the backend.

**Fixed:**
- **All P0s.**
  - The build works.
  - The API client refreshes the token before it expires and retries once on a 401, then signs out and returns to the page after sign-in.
  - Every request goes through one authenticated client.
  - The API runs on port 4000.
  - `.env.example` replaces `env_example.txt`.
  - Each clip opens its own composition in the editor, which loads and saves the full timeline and exports through `{ compositionId }`.
- **Section 5 backend work.**
  - Timeline `GET`/`PUT` endpoints.
  - A `projects` read model with clips, compositions, latest render, documents and jobs.
  - Rendering jobs return `outputUrl` and errors.
  - AI jobs report a pipeline `stage`.
  - Stripe Customer Portal endpoint.
  - Search over projects.
- **Auth.**
  - Field errors from the backend appear on the form fields.
  - The password rule matches the backend.
  - `callbackUrl` is honoured.
  - New accounts get a "check your email" step with a resend option.
  - The reset (`/auth/password-change`) and email-change (`/auth/confirm-new-email`) links have pages.
  - Logout ends the session on the server.
  - Dead `/terms` and `/privacy` links are gone.
- **Repurpose.**
  - Progress shows the real pipeline stage.
  - Projects are URLs (`/dashboard/projects/[id]`), so they survive a refresh.
  - Documents are editable and saved as new versions.
  - There are no fake buttons or duplicate saves.
  - The 1-credit cost is shown up front.
  - Running out of credits shows a top-up prompt.
- **XSS.** No AI output is rendered as HTML.
- **Library.**
  - Lists projects (not raw assets), with server-side search and infinite scroll.
  - Deleting a project asks for confirmation and cancels its pending posts. The backend change is verified against Postgres.
- **Scheduling and calendar.**
  - Scheduling takes a title, caption and hashtags.
  - Each account is scheduled independently, with per-account results and a "retry failed" option.
  - Text posts are offered only to LinkedIn.
  - The calendar loads only the visible month (backend `from`/`to` filters) and keeps the month in the URL.
  - Clicking a post shows its error and lets you publish now, retry, reschedule, cancel or delete.
- **Editor.**
  - Preview of text and image overlays, including the karaoke colouring the export uses.
  - Move and trim with snapping (hold Alt to turn it off), zoom and fit.
  - Undo and redo; keyboard shortcuts for space, delete, arrows and ⌘Z/⌘S.
  - An inspector with validated inputs.
  - Autosave plus a guard against leaving with unsaved changes.
  - An export popover with render status and download.
- **Connections.**
  - OAuth result toasts.
  - Several accounts per platform.
  - A "Reconnect needed" state (backend `needsReconnect`).
  - Disconnecting asks for confirmation. Disconnecting an account that had posts used to fail with a 500; it's now fixed and verified.
- **Billing.**
  - Checkout result toasts.
  - The current plan is highlighted.
  - Real portal link and transaction history.
- **Analytics.** A 7/30/90-day range, "Sync now" with a last-synced time, an empty state, and the engagement series charted.
- **App shell.**
  - Real activity notifications.
  - A grouped sidebar and a dashboard home page.
  - Settings for profile, password and account deletion. Deleting an account now cancels its pending posts.
  - Template leftovers, the tours and dead code are removed.
- **Cross-cutting.**
  - Query keys are namespaced per domain.
  - Mutation errors show as toasts.
  - Requests time out after 30 s.
  - The dashboard has an error boundary.
  - Sentry is off unless a DSN is set, sends no PII and samples 10% of traces.
  - Unused dependencies are removed and the package is renamed.

**Verified in a real browser.** The main flows were driven headlessly (Playwright) against a local API and Postgres, and all 15 checks pass:
- sign in;
- edit a document and save it as a new version;
- schedule a post, which charges 1 credit;
- open the post in the calendar and cancel it;
- edit a caption in the editor and see it autosave;
- undo;
- trim the clip;
- play;
- queue an export;
- update the profile;
- delete a project and see its posts cancelled.

That testing found and fixed:
- **Every dashboard page returned 500 on server render.** The persist API isn't available on the server.
- **Scheduling was always rejected.** The API didn't whitelist `metadata`, so caption, title and hashtags couldn't be sent. Only those three fields are now accepted; publisher-written keys are refused. Edits merge into the existing metadata instead of replacing it, so `lastError` survives an edit.
- **Users without a wallet showed 0 credits forever**, e.g. seeded or older accounts. The wallet is now created on first read.
- **Local asset URLs (`/files/assets/…`) returned 404** with `FILE_DRIVER=local`, which broke the clip players and the editor preview. Helmet would also have blocked them cross-origin.
- **A clip's length included captions running past it**, which would make the export end on empty frames. The length now follows the clip, and the editor marks anything beyond it.
- Nested validation errors showed as "[object Object]".
- The selected state of segmented toggles wasn't visible.
- Deleting a project refetched the deleted project.

**Done since (25 Nov 2026):**
- **Tests and CI.** Vitest unit tests for the editor model, error mapping, audio sync and analytics sorting (`pnpm test`). A GitHub Actions workflow runs a check for injected code, then lint, typecheck, tests and build, with dependency install scripts turned off.
- **File upload for repurposing.** Repurpose takes a link or a file: MP4 video, or MP3, M4A or WAV audio, up to 500 MB (`UPLOAD_MAX_MB`), with upload progress. The API checks each file's leading bytes and stores it as the project's `original` asset (`POST /v1/content-assets/upload`).
- **Studio controls.** Tone, visual style, aspect ratio, voice and length, per output type. The API checks each value against a fixed list before it reaches a prompt or ffmpeg. Generated videos render at the chosen ratio.
- **Per-post and per-account analytics.** The Analytics page has tables by account and by post, sortable, with views gained in the selected range (`GET /v1/analytics/posts` and `/accounts`).
- **Editor.**
  - Split at the playhead (S): clips, captions (words are divided between the halves) and audio.
  - The main track holds several clips played back to back. Trims and deletes ripple what follows, and captions of cut footage go with it.
  - The renderer joins the clips. The API rejects gaps and overlaps (`clipsMustBeContiguous`).
  - Audio overlays play in the preview, kept in sync with the playhead.
- **Tokens out of localStorage.**
  - The refresh token is an HttpOnly cookie scoped to `/api/v1/auth`. The access token lives in memory, and a reload gets a new one from the cookie.
  - Refreshes are serialised across tabs. A just-replaced refresh token stays valid for 30 s, so a reload that drops the response doesn't sign the user out.
  - `AUTH_COOKIE_SAMESITE=none` is for deployments where the web app and API are on different sites.

**Still open:**
- No browser (end-to-end) tests in CI. The Playwright flows used to verify this work need a seeded database, so they are run by hand.
- Clips on the main track come from one source file. There is no way to add a second video.
- Audio overlays above 100% volume play at 100% in the preview (browser limit); the export applies the full level.

---

## 1. Release blockers

| # | Sev | Issue | Where |
|---|---|---|---|
| 1 | P0 | **The build fails.** 8 files import `framer-motion`, but only `motion` is in `package.json` (and `framer-motion` isn't installed), so `next build` stops on "Cannot find module". | repurpose-flow, clips-preview, creative-studio, cms-view-page, calendar-view, connections-view-page, timeline, onboarding-tour |
| 2 | P0 | **15 TypeScript errors.** Besides #1: `ScheduledPost` has no `metadata` or `postUrl` (published-posts-list), the plan type has no `mode` (subscription page), and there are implicit `any`s in timeline. | `src/types/api.ts`, `subscription.ts` |
| 3 | P0 | **Users are effectively logged out after 15 minutes.** The backend access token lasts 15 min (`AUTH_JWT_TOKEN_EXPIRES_IN`), but the frontend never calls `/auth/refresh`. The `token` cookie lives 7 days, so middleware still lets the user into `/dashboard`, but every API call returns 401 and shows a generic error toast. There is no 401 handling and no redirect to sign-in. | `api-client.ts`, `auth-store.ts` |
| 4 | P0 | **The editor and the activity feed send no auth token.** `editor-api.ts` and `audit/api/audit.ts` call `apiClient` directly instead of `useApi`, so every request goes out without the `Authorization` header and gets 401. | `features/editor/api/editor-api.ts`, `features/audit/api/audit.ts` |
| 5 | P0 | **Port clash in local setup.** The backend `APP_PORT=3000` and Next dev also defaults to 3000. `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3000/api`, and the backend's `FRONTEND_DOMAIN` and `BACKEND_DOMAIN` are both `:3000`. Run the API on 4000 (or the web app on 3001) and set the env vars to match. | `api-client.ts`, backend `.env` |
| 6 | P0 | **`env_example.txt` is from the starter template.** It lists Clerk keys and `/dashboard/overview`, and omits `NEXT_PUBLIC_API_URL`, the only variable the app actually needs. | `env_example.txt` |

---

## 2. Feature flows

For each flow: what happens today step by step, then what is broken or missing.

### 2.1 Authentication

**Flow:** Sign up (`POST /v1/auth/email/register`) → confirmation email → `/auth/confirm-email?hash=` → `POST /v1/auth/email/confirm` → sign in (`POST /v1/auth/email/login`) → the token is stored in localStorage (zustand) **and** a JS-readable cookie → `/dashboard/repurpose`. Forgot password → email → `/auth/reset-password?hash=`. Google: button → `GET /v1/auth-google/login` → Google → `/auth/google/callback` → `POST /v1/auth-google/callback`.

| Sev | Issue |
|---|---|
| P0 | No token refresh or 401 handling (see #3). `refreshToken` is stored but never used, and logout never calls `POST /auth/logout`, so the backend session stays alive. |
| P1 | **Password rules disagree.** The sign-up and reset forms accept 6+ characters, but the backend requires 8. A 6–7 character password gets a 422 that shows as "Unprocessable Entity". |
| P1 | **Field errors are never shown.** The backend returns `{status, errors: {email: 'emailAlreadyExists'}}`, but `api-client` only reads `data.message`, so every validation error becomes "Unprocessable Entity". Map `errors` onto form fields (react-hook-form `setError`). |
| P1 | `callbackUrl` is set by middleware but ignored after login: the user always lands on `/dashboard/repurpose`. |
| P1 | Nothing tells a newly registered user to confirm their email, and there is no "resend confirmation" (the backend has `POST /auth/email/confirm/new`). |
| P1 | Sign-in and sign-up link to `/terms` and `/privacy`, which don't exist (404). |
| P2 | Security: the access token sits in localStorage plus a non-HttpOnly cookie, so any XSS can steal it. The blog preview renders AI output with `dangerouslySetInnerHTML` (2.2), which is exactly that vector. At minimum, sanitize HTML (DOMPurify). |
| P2 | Leftovers: `github-auth-button.tsx` (logs to console), unused `useTransition`, and `callbackUrl` variables. |

### 2.2 Repurpose (core workflow)

**Flow:** Paste a URL → pick output types (Short clips / Blog / LinkedIn / Threads) → `POST /v1/contents` → `POST /v1/ai-jobs {jobType:'repurpose'}` → poll `GET /v1/ai-jobs/:id` every 2 s → result tabs. On the backend, the job downloads the source with yt-dlp, transcribes it, detects hooks, cuts clips (saved as `clip` assets and compositions) and writes blog, LinkedIn and thread variants.

| Sev | Issue |
|---|---|
| P0 | **"Advanced Editor" opens `/dashboard/editor/new`**, which isn't a composition id, so the editor can't load anything. Each clip should link to its own composition (see 2.5). |
| P1 | **Progress is lost on navigation.** The job id lives only in component state. Leaving the page or refreshing drops the running job with no way back to it, and the credits are already spent. Put the job id in the URL (`?job=`) and add a job history list (`GET /v1/ai-jobs` already exists; `useGetJobs` is never used). |
| P1 | **Edits are thrown away.** The blog, LinkedIn and Threads results render in a `RichTextEditor` with `onChange={() => {}}`. |
| P1 | **Fake buttons:** "Save All Results", the four "AI Assistant" refine buttons, "Post to LinkedIn" and "Share on Twitter" do nothing. Twitter/X isn't a supported platform in the backend at all. |
| P1 | **Clips are saved twice.** "Save Clip" creates another `video_clip` asset with `storageProvider:'s3'` hard-coded, but the backend already stored every clip as a `clip` asset. |
| P1 | **The progress stepper is fake.** It maps `processing` to step 1 and shows "Uploading" for URL imports. The backend doesn't report pipeline stages, so the UI can't show real progress. |
| P1 | No URL validation before spending a credit, and no cost preview (the backend charges per job; the UI only checks `balance >= 1`). |
| P1 | "Upload File" is a "Coming soon…" card, but the backend already supports source files through content assets. |
| P1 | LinkedIn and Threads output is plain text but is fed to an HTML editor, so line breaks collapse. |
| P2 | A failed job shows a toast and resets to step 1, which loses the user's selections. |
| P2 | XSS: `BlogPreview` renders `activeJob.output['blog-post']` with `dangerouslySetInnerHTML` without sanitizing it. |

### 2.3 Create studio (generate from a prompt)

**Flow:** Pick Video / Images / Blog → enter a prompt → `POST /v1/ai-jobs` (`video_generation` / `image_generation` / `blog_generation`) → poll → preview.

| Sev | Issue |
|---|---|
| P1 | **The style, ratio and tone controls are missing.** The state exists (`style`, `ratio`, `tone`) and the Select components are imported, but no controls are rendered, so every job uses `cinematic`, `9:16` and `professional`. |
| P1 | **A failed job disappears silently.** On `failed` the code just clears the job id: no message, and the job's `errorMessage` is never shown. |
| P1 | **Retry does nothing.** It calls `setActiveJobId(activeJobId)` with the same value. |
| P1 | **"Save to Library" creates duplicates.** The backend already creates the content row and the asset for every generated item (`ensureContent`). For blogs it also posts the whole markdown text as `fileUrl`. |
| P2 | The blog prompt is split into "keywords" with `prompt.split(' ')`. |
| P2 | The generation state is lost on tab change or navigation (same as 2.2). |

### 2.4 Content library and scheduling (`/dashboard/content`)

**Flow:** `GET /v1/content-assets` (infinite scroll) → grid / table / calendar → ⋯ menu → Schedule → modal → `POST /v1/scheduled-posts` for each selected account. The "Activity" tab shows a calendar and published posts.

| Sev | Issue |
|---|---|
| P1 | **The library shows raw assets, not content.** Source downloads (`original` mp3/mp4), clips, images and generated videos are all mixed in. Every item is labelled "Untitled Clip", has status "saved", and opens in a `<video>` player even when it's an image or audio. The library should list **contents** (`GET /v1/contents`), each grouped with its clips and variants. |
| P1 | **The status filter never matches.** "Draft" and "Live" filter on `item.status`, which is hard-coded to `'saved'`. |
| P1 | **Search only covers loaded pages** (client-side filter) and isn't sent to the backend. |
| P1 | **"Edit Project" does nothing** in both the grid and table views. |
| P1 | **The "Calendar" view toggle does nothing** in the Library tab; the calendar only appears under "Activity". |
| P1 | **The calendar ignores the month.** It always loads the first 100 posts, then filters client-side, and the "posts scheduled this month" count is really the total count. |
| P1 | **The Activity list asks for the wrong data.** It loads pending posts and then filters for `published`/`failed`, so it's always empty or incomplete. `GET /v1/scheduled-posts/published` exists (`useGetPublished`) but isn't used. |
| P1 | **Retry publishing is broken.** It uses `fetch(`${NEXT_PUBLIC_API_URL}/api/v1/...`)` (the URL ends up with `/api` twice) and reads the token from `localStorage.authToken`, which doesn't exist, then reloads the page. Use `POST /v1/scheduled-posts/:id/retry` through `useApi`. |
| P1 | **There's no way to manage scheduled posts.** Cancel (`cancelMutation`) and publish-now (`publishNowMutation`) exist but no UI uses them, and you can't click a calendar entry to open it, reschedule or see why it failed. |
| P1 | **Scheduling has no caption or per-platform options** (title, description, hashtags, YouTube privacy). The post goes out with whatever the backend derives. |
| P1 | **Partial failures leave a mess.** Scheduling to several accounts runs `Promise.all`; if one fails, the others are already created but the modal shows a single error. |
| P2 | Grid cards show hard-coded Twitter and user icons as "platforms". |
| P2 | The scheduling modal is fixed at `h-[750px]` and `sm:max-w-7xl`, so it breaks on laptops and mobile. Times are local, with no timezone shown. |
| P2 | Deleting uses the native `confirm()`. |

### 2.5 Video editor (`/dashboard/editor/[id]`): incomplete

**Intended flow:** open a clip's composition → see tracks and elements on a timeline → trim, move and add text → Save → Export (`POST /v1/rendering-jobs`) → watch the render → download or schedule the result.

**What exists:** a zustand store, a 9:16 canvas that plays the first video element, a timeline with drag-to-move (framer-motion), a properties panel (text, size, Y position, start/end ms), an "Add text" button, and a 5-step guided tour.

**Why it doesn't work end to end:**

| Sev | Issue |
|---|---|
| P0 | No auth header on any request (#4). |
| P0 | **No way to open a real composition.** The only entry point is `/dashboard/editor/new`. Nothing lists compositions, and clip cards don't link to theirs. |
| P0 | **The backend doesn't return a timeline.** `GET /v1/content-compositions/:id` returns `resolutionWidth/Height`, `durationMs`, `fps` and `metadata`, but **no `tracks` or `elements`**. The frontend reads `width`, `height`, `name` and `tracks`, which are all undefined. The track and element controllers were removed in the backend cleanup, so this needs a new backend endpoint (for example `GET/PUT /v1/content-compositions/:id/timeline`, returning tracks with their elements and taking the whole timeline back). |
| P0 | **Save is rejected.** `PATCH` sends `{tracks}`, but the update DTO has no `tracks` and the global ValidationPipe uses `forbidNonWhitelisted`, so the backend answers 422. |
| P0 | **Export is rejected.** The frontend sends `{compositionId}`, but the backend expects `{composition:{id}, status, outputFormat}`, so it returns 422. |
| P0 | **No way to get the rendered video.** Rendering jobs have no `outputUrl` or `progress`; the file is in `render_outputs`, which has no endpoint. The backend needs to return the output URL on the rendering job. There's also no page that lists renders (the toast mentions "the export dashboard", which doesn't exist). |
| P1 | Editing is minimal: no resize or trim handles (they're drawn but "visual only"), zoom +/- buttons that do nothing, no split, no undo/redo, no snapping, no keyboard shortcuts (space, delete), and no image, audio or caption tracks. Only text can be added, and only if a text track already exists. |
| P1 | **The preview doesn't match the render.** The canvas always assumes 9:16 and plays only the first element of the video track, muted, so cuts across several clips and audio aren't previewed. |
| P1 | **No unsaved-changes guard** before leaving or refreshing, and no autosave. |
| P1 | Typing a start or end time accepts NaN and negative values; nothing checks end > start or end ≤ duration. |
| P2 | **The editor store is global and never reset**, so opening a second project briefly shows the first one's tracks and selection. |
| P2 | The tour says "This will consume 100 AI credits"; check this against the backend's real price. |

### 2.6 Connections (`/dashboard/connections`)

**Flow:** Connect → `GET /v1/platform-accounts/connect/:platform` → OAuth → backend callback → redirect to `/dashboard/connections?success=…&platform=…&error=…`.

| Sev | Issue |
|---|---|
| P1 | **The page ignores the OAuth result.** The `?success` and `?error` query parameters are never read, so the user gets no "Connected" or "Connection failed" message. |
| P1 | **Only one account per platform is shown.** The page uses `realAccounts.find(...)`, so a second channel on the same platform is invisible and can't be disconnected. |
| P1 | **Expired or revoked tokens look "Active".** There's no "Reconnect" state; the backend's `isConnected` field is never used. |
| P2 | "Bank-grade Security" badge; native `confirm()` for disconnect. |

### 2.7 Billing (`/dashboard/subscription`)

**Flow:** Wallet (`GET /v1/billing/wallet`, refetched every 30 s) + plans (`GET /v1/billing/plans`) → plan button → `POST /v1/billing/checkout` → Stripe → `/dashboard/subscription?success=true|canceled=true`.

| Sev | Issue |
|---|---|
| P1 | **No confirmation after checkout.** `?success` and `?canceled` are ignored (no message), and the wallet isn't refetched straight away. |
| P1 | **"Manage in Stripe" is a hard-coded test link** (`billing.stripe.com/p/login/test_your_link`). The backend needs a Customer Portal session endpoint. |
| P1 | **Plan state is wrong.** The current plan isn't highlighted, any active subscription is called "Premium Plan", and "Get Starter" is offered to a user who already has Starter. |
| P1 | No transaction history; `GET /v1/billing/transactions` exists but is unused. |
| P2 | Usage can divide by zero (NaN width when total credits = 0). The plan feature list is hard-coded ("Full Video Editor Access"). |

### 2.8 Analytics (`/dashboard/analytics`)

**Flow:** `GET /v1/analytics/overview` → KPI tiles, views line chart, platform pie chart, platform list.

| Sev | Issue |
|---|---|
| P1 | **The date range is fixed.** It says "Last 30 days" with no picker, although the API accepts `startDate` and `endDate`. |
| P1 | **No per-post or per-account views**, although the backend has `content/:id` and `platform-account/:id` analytics endpoints. |
| P1 | **No way to sync.** The backend has `POST /analytics/sync/all`, but the UI never calls it and doesn't say when the data was last synced. |
| P2 | Empty state: a new user sees zeros and an empty pie instead of "Connect an account and publish to see analytics". The engagement series is fetched but never plotted. |

### 2.9 Notifications, activity and the app shell

| Sev | Issue |
|---|---|
| P1 | **Notifications are fake.** The store is client-only, seeded with a hard-coded "Welcome" item and reset on reload. The backend writes real activity (`audit-activity/activity`: job completed or failed, posts), but it isn't shown. "View All Activity" does nothing. |
| P1 | `RecentActivityList` (the real feed) isn't rendered anywhere, and it would get 401 anyway (#4). |
| P1 | **Starter-template leftovers in the sidebar:** an org switcher with fake tenants ("Beta Corp", "Gamma Ltd"), the plan labelled "Enterprise", and no-op "Billing", "Notifications" and "Settings" menu items in both user menus. |
| P1 | **Profile page is a placeholder** ("currently being updated"). The backend supports `PATCH /auth/me` (name, username, email, password) and `DELETE /auth/me`; none of it is wired up. The unused `profile-create-form.tsx` is a template resume form ("Edit product", India/Kerala). |
| P2 | The header has a theme selector and a theme-scaled cookie from the template, which a product doesn't need. `TourTriggerButton` is imported but not rendered, and `TourProvider` isn't mounted, so rendering it would crash. |
| P2 | **Two onboarding systems** (`features/tour` and `components/onboarding`). Skipping the editor tour doesn't mark it complete, so it restarts on every visit. |
| P2 | `/dashboard` and `/` redirect only when there's a cookie; there's no dashboard home page that summarises credits, recent jobs and upcoming posts. |

---

## 3. Cross-cutting issues

| Sev | Issue |
|---|---|
| P1 | **API layer.** Errors flatten the backend's `errors` object; a 204 returns `{}` typed as `T`; `params` builds `?` even when empty. There's no request timeout or abort, and no central 401 handler. |
| P1 | **Query keys collide.** `['ai-jobs', id]` and `['ai-jobs', params]` share a prefix, `['contents', page, limit]` overlaps the infinite key, and `staleTime` of 5 min hides fresh job and post state. |
| P1 | **No error boundaries per route** (only `global-error.tsx`), so a render error in one widget blanks the whole app. There are no `loading.tsx` files. |
| P1 | **Sentry sends too much by default.** It's on unless `NEXT_PUBLIC_SENTRY_DISABLED` is set, with `sendDefaultPii: true` and `tracesSampleRate: 1` (100% of traces plus PII), and `org`/`project` are still `FIXME`. |
| P1 | **No tests and no CI** for the frontend (lint, type-check and build aren't run anywhere). |
| P2 | **Accessibility:** clickable `div`s without roles or keyboard support (type cards, account picker, library thumbnails, timeline), icon-only buttons without labels, tiny 8–10 px text in many places, and colour-only status cues. |
| P2 | **Responsive layout:** fixed widths (schedule modal 750 px tall, editor panels 300 px, canvas `calc(100vh-400px)`), `overflow-hidden` on `<body>`, and the editor is unusable under ~1100 px. |
| P2 | `next.config.ts` image hosts include `api.slingacademy.com` (template) but not the S3 or CloudFront host the backend serves media from. |
| P2 | Mixed icon sets (Tabler + Lucide + Radix) and mixed animation libraries. |

---

## 4. Dead code and dependencies to remove

- **Unused files:** `components/{file-uploader,nav-main,nav-projects,nav-user,form-card-skeleton,org-switcher,theme-selector,modal/alert-modal}`, `constants/mock-api.ts`, `constants/data.ts` (everything except `navItems`), all `features/*/constants/mock-*.ts`, `features/profile/components/profile-create-form.tsx` and `utils/form-schema.ts`, `features/auth/components/github-auth-button.tsx`, `features/tour/*`, `hooks/{use-data-table,use-multistep-form,use-debounce}`, `lib/searchparams.ts`, `components/ui/table/data-table-*`, and unused shadcn primitives (`navigation-menu`, `hover-card`, `drawer`, `radio-group`, `pagination`, `context-menu`, `menubar`, `alert-dialog`, `aspect-ratio`, `resizable`, `input-otp`, `file-upload-zone`).
- **Unused dependencies:** `@clerk/nextjs`, `@clerk/themes`, `@dnd-kit/*`, `@radix-ui/react-toast`, `react-responsive`, `sort-by`, `uuid`, `kbar` (if the command bar goes), `@faker-js/faker`, and `match-sorter`/`nuqs` if their only users go too.
- **Package name** is still `next-shadcn-dashboard-starter`.

---

## 5. Backend changes the frontend needs

These are needed for the editor and several flows to work:

1. `GET /v1/content-compositions/:id/timeline` returning the composition **with** tracks and their elements, and `PUT` for the same shape (replaces the removed track and element controllers).
2. A way to find a clip's composition: return `compositionId` on each `short-clips-variants` item and on `clip` assets, or `GET /v1/content-compositions?contentId=`.
3. `POST /v1/rendering-jobs` that accepts `{ compositionId }` and fills in status and format server-side; include `outputUrl` (and an error message) in rendering job responses.
4. A pipeline `stage` field on AI jobs (downloading → transcribing → detecting → cutting → writing) for real progress.
5. A Stripe Customer Portal session endpoint.
6. Optional: `GET /v1/contents` with a search parameter, and each content's assets and variants embedded.

---

## 6. UI/UX redesign direction

The current UI mixes starter-template patterns with oversized marketing-style headers ("Repurpose **Magic**", "Digital **Ecosystem**"), 32 px rounded cards, heavy shadows, 9–10 px uppercase labels and scale-on-hover everywhere. That reads as a template, not a tool.

**Recommended base: Linear's design language** from getdesign.md (`npx getdesign@latest add linear.app`):

- **Why Linear:** it's dense and precise, with one accent colour and quiet surfaces. That suits a work tool with a timeline editor, a calendar and tables, where the user's media should be the colourful thing on screen.
- **Tokens:** canvas `#010102`, surfaces `#0f1011` / `#141516`, hairlines `#23252a`, text `#f7f8f8`, accent `#5e6ad2`. Inter 500–600 with tight tracking. Radii are 8 px for controls, 12 px for cards and pills for tags.
- **Light mode:** Linear only documents dark mode, so light mode would be derived from it with the same accent and neutral greys.
- **Alternatives:** Raycast (even more compact, dark), Supabase or Cal.com (light-first, product UI shown inside cards; Cal.com suits a calendar product).

**UX changes planned with the redesign:**

1. **Navigation.** A real dashboard home (credits, running jobs, upcoming posts, recent outputs) and a sidebar grouped as Create (Repurpose, Studio) · Library · Publish (Calendar, Connections) · Insights (Analytics) · Account (Billing, Profile).
2. **Projects.** Each repurpose run becomes a project page (`/dashboard/projects/[contentId]`) with tabs for Clips, Blog, Posts, Transcript and Schedule. It survives a refresh and shows live job progress.
3. **Library.** A content-first library with type filters, server-side search and a detail drawer.
4. **Calendar.** Month and week views with click-to-open, reschedule, cancel and retry.
5. **Editor.** Full-height layout with a resizable timeline and working trim, move, zoom, undo, autosave, export progress and download.
6. **Consistency.** Consistent empty, loading and error states. Form field errors come from the backend, and confirmations use a proper dialog instead of `confirm()`.
