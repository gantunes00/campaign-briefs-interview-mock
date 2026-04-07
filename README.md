# Campaign Briefs API — interview mock

Small **Express** service used in **Senior QA** live interviews. It exposes versioned JSON endpoints under `/v1`, expects a **Bearer token**, and ships with an **OpenAPI 3** description in [`openapi.yaml`](openapi.yaml).

**Interviewers:** use **[`CANDIDATE_INSTRUCTIONS.md`](CANDIDATE_INSTRUCTIONS.md)** as the **live** briefing during the session (not sent to candidates beforehand).

## Requirements

- Node.js 20+

## Run locally

1. Copy environment template and set a token:

   ```bash
   cp .env.example .env
   # Edit .env — set INTERVIEW_API_TOKEN to a non-empty secret
   ```

2. Install and start:

   ```bash
   npm install
   npm start
   ```

   The server loads variables from **`.env` in the project root** (next to `package.json`) via `dotenv`.

3. Health check (no auth):

   ```bash
   curl -s http://localhost:8080/health
   ```

Default listen address: `0.0.0.0:8080` (override with `PORT`).

## API quick reference

- **Base path:** `/v1`
- **Auth:** `Authorization: Bearer <INTERVIEW_API_TOKEN>`
- **POST** `/v1/campaign-briefs` — create a brief (`Content-Type: application/json`)
- **GET** `/v1/campaign-briefs?accountId=<uuid>&page=1&pageSize=20` — list by account

Full contract: [`openapi.yaml`](openapi.yaml).

### Example: create

```bash
curl -sS -X POST http://localhost:8080/v1/campaign-briefs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Q2 enterprise rollout",
    "objective": "Drive pipeline in DACH with webinars and a roundtable.",
    "tags": ["dach", "webinar"]
  }'
```

### Example: list

The server seeds **25** briefs for account `3fa85f64-5717-4562-b3fc-2c963f66afa6` so list/pagination can be exercised without many creates.

```bash
curl -sS "http://localhost:8080/v1/campaign-briefs?accountId=3fa85f64-5717-4562-b3fc-2c963f66afa6&page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Example API tests (Vitest + Axios)

Starter file for candidates to extend — [`tests/campaign-briefs.api.example.test.mjs`](tests/campaign-briefs.api.example.test.mjs) (Vitest + Axios; `it.todo` placeholders).

1. **Terminal A:** start the mock (`npm start` with `.env` set).
2. **Terminal B** (same repo, same `.env`):

   ```bash
   npm install
   npm run test:api-example
   ```

Optional: override base URL with `API_BASE` (must include `/v1`), e.g. `API_BASE=https://your-run-url/v1 npm run test:api-example`.

### Against a remote deployment (no local server)

From this repo, point tests at Cloud Run (or any host) using **environment variables only** — no local `npm start` required:

```bash
export API_BASE='https://YOUR-SERVICE-XXXX.region.run.app/v1'
export INTERVIEW_API_TOKEN='same token configured on the deployment'
npm run test:api-example
```

(`INTERVIEW_API_TOKEN` in your shell takes precedence over `.env` if both exist.)

## Docker

```bash
docker build -t campaign-briefs-mock .
docker run --rm -e INTERVIEW_API_TOKEN=dev-token -e PORT=8080 -p 8080:8080 campaign-briefs-mock
```

## Deploy on Google Cloud Run

Set `INTERVIEW_API_TOKEN` in the service configuration (prefer **Secret Manager** for real use).

```bash
gcloud run deploy campaign-briefs-mock \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "INTERVIEW_API_TOKEN=your-secret"
```

After deploy, use your Cloud Run URL as the base (paths remain `/v1/...`).

## Repository layout

| Path | Purpose |
|------|---------|
| `CANDIDATE_INSTRUCTIONS.md` | **Live interview** — briefing script / shared agenda (not advance prep) |
| `openapi.yaml` | API contract |
| `src/server.js` | Mock implementation |
| `tests/campaign-briefs.api.example.test.mjs` | Starter automation (Vitest) |
