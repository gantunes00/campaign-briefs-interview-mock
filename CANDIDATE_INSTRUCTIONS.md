# Technical interview — Live exercise briefing

**This briefing is given during the interview**, not sent ahead of time. Your interviewer will share what you need in the moment: typically a **base URL**, a **Bearer token**, access to the **OpenAPI** description, and (if applicable) this repository or a clone you open during the session.

Use the sections below as a **shared agenda** you can follow while you work.

---

## During the session — what you need

Your interviewer will confirm how you are set up. Usually you will have:

- **Node.js 20+** and **npm** (or **pnpm** / **yarn**) on the machine you are using for the call.
- A **stable network** if the API is hosted remotely.
- Your **IDE** or editor and a terminal. **Postman**, **Insomnia**, or similar are fine if you prefer them.

If you are asked to run the mock **locally** from this repository, the interviewer will walk you through it or you can follow these steps when they say to:

1. Copy `.env.example` to `.env` and set `INTERVIEW_API_TOKEN` to the **token they give you on the call** (unless they specify otherwise).
2. Run:

   ```bash
   npm install
   npm start
   ```

3. Confirm the service is up:

   ```bash
   curl -s http://localhost:8080/health
   ```

   You should see `ok`.

If the API is **only** reachable at a **remote URL**, you do **not** need to start the server yourself. Use the URL and credentials your interviewer provides in the session.

---

## Contract

The API is described in **[`openapi.yaml`](openapi.yaml)** (your interviewer will make this available—file, link, or paste). Treat it as the **source of truth** for:

- Paths and base URL (including the `/v1` prefix).
- Required headers (**`Authorization: Bearer <token>`**; **`Content-Type: application/json`** on `POST` bodies).
- Request and response shapes, status codes, and query parameters.

Use the **seeded account id** your interviewer points you to (same value as in the examples in this repo’s README and in `openapi` samples) when listing data so you have enough rows to exercise pagination without creating many records first.

---

## Part 1 — Automation (live coding)

You will implement **automated checks** against the running API (not only manual clicks). The interviewer will state the exact expectations on the call; typically they include showing that:

1. A **valid create** request returns **success** with the **required fields** defined in the contract.
2. A **list** request returns **success** with the **expected list/pagination shape**.
3. **Unauthorized** access is rejected appropriately when credentials are missing or invalid.
4. A **clearly invalid** request body is rejected with an error response you can describe or assert on.

**Suggested stack (optional):** if you are using this repo, there is a **Vitest** starter at [`tests/campaign-briefs.api.example.test.mjs`](tests/campaign-briefs.api.example.test.mjs). You may extend it or use **Jest**, **curl scripts**, or another approach you are productive with.

**Practical tips:**

- Use a **unique title** or similar when creating resources so tests stay isolated across runs.
- Prefer assertions on **HTTP status** and **stable parts of the JSON contract** rather than brittle full-response snapshots.
- If the API is remote, set **`API_BASE`** to the full base including **`/v1`**, for example:

  ```bash
  export API_BASE='https://your-host.example/v1'
  export INTERVIEW_API_TOKEN='token-from-interviewer'
  npm run test:api-example
  ```

---

## Part 2 — Debug and contract review

After Part 1, the session usually moves to a **debug / analysis** block (often about **15–20 minutes** in a 60-minute slot). The goal is **not** to memorize status codes—it is to show how you **compare a live API to its contract**, narrow down **unexpected behavior**, and propose **checks** that would catch problems early.

### What this part is about

In real projects, **documentation and behavior do not always match**. You may see:

- A response status or body shape that **differs** from [`openapi.yaml`](openapi.yaml).
- An error format that is **inconsistent** across similar failures.
- Validation rules that **feel** stricter or looser than the written schema.

Your job is to **investigate calmly**: reproduce, observe, then explain.

### What to cover for each scenario

For every situation the interviewer gives you on the call, be ready to cover **four points**:

| # | What to cover |
|---|----------------|
| 1 | **Expected** — What should happen if you trust the **OpenAPI** document (and reasonable REST conventions where the spec is silent)? |
| 2 | **Actual** — What **really** happens? Note **HTTP status**, **response body** (and **Content-Type** if relevant), and any **headers** that matter. |
| 3 | **Hypothesis** — Where might the gap come from (e.g. validation layer, routing, pagination math, header handling)? You do not need to be right on the first guess—you need a **clear, testable** theory. |
| 4 | **Regression** — What **one automated assertion** or **contract test** would you add so this does not come back unnoticed? (It can be a Vitest case, a CI check, or a Postman assertion—whatever fits how you work.) |

You may use **`curl`**, your **tests from Part 1**, **Postman/Insomnia**, or a quick one-off script. Reproducibility matters: your interviewer should be able to repeat your steps.

### Standard scenarios (typical loop)

The interviewer will guide you. In many sessions you will be asked to look at **four** situations (there may be **exactly four** distinct topics to discuss—they will confirm). Typical probes:

| # | Situation | What to think about |
|---|-----------|---------------------|
| **A** | **`POST /v1/campaign-briefs`** with a **valid JSON body**, but the **`Content-Type` is not `application/json`** (for example `text/plain`), or the header is **omitted**. | How do clients and servers usually agree on JSON bodies? What does the spec imply about errors? What do you actually get (status, body format)? |
| **B** | **`POST`** with **`tags`: `["DACH"]`** (uppercase letters). | What does [`openapi.yaml`](openapi.yaml) say about **tag** values? If the server accepts the request, is that **aligned** with the schema? Is the issue in the spec, the implementation, or both? |
| **C** | **`GET /v1/campaign-briefs?accountId=not-a-uuid&page=1`** with **valid authentication**. | Invalid query parameters often produce **client errors** (`4xx`) with a structured body. What happens here? Is the error shape **consistent** with other validation errors you saw in Part 1? |
| **D** | **`GET`** with a **valid `accountId`**, **`page=2`**, **`pageSize=10`**. The seeded account has **enough rows** (as described on the call / in the shared materials) to fill more than one page. | For pagination, what does the contract say about **`items`**, **`page`**, **`pageSize`**, and **`total`**? Count the **number of items returned** for page 2—does it match what you expect from the spec and from the total number of rows? |

Use the **same Bearer token** as in Part 1 unless the scenario is explicitly about **missing or invalid auth**.

### Follow-up questions you might hear

Be ready to discuss briefly:

- Whether a mismatch is a **spec** issue, an **implementation** issue, or **both**.
- How you would **write a bug ticket** (steps, payload, response snippet).
- Whether you would **block a release** on this class of issue (risk and context—not a single “right” answer).

### Mini template (you can think out loud in this shape)

```text
Scenario: [short name]
Expected (OpenAPI / conventions): …
Actual: status ___ ; body ___ ; Content-Type ___
Hypothesis: …
Regression check I would add: …
```

---

## Quick reference — `curl`

Use the **host** and **token** your interviewer gives you during the session.

**List (example account id from shared materials):**

```bash
curl -sS "http://localhost:8080/v1/campaign-briefs?accountId=3fa85f64-5717-4562-b3fc-2c963f66afa6&page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create:**

```bash
curl -sS -X POST http://localhost:8080/v1/campaign-briefs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "My test brief",
    "objective": "Objective text with at least ten characters."
  }'
```

### Optional — `curl` starting points for Part 2 probes

Replace **`BASE`** (API root including **`/v1`**) and **`YOUR_TOKEN`** with the values from the interview.

**A — `POST` with JSON bytes but `Content-Type` not `application/json`:**

```bash
curl -sS -w "\nHTTP %{http_code}\n" -X POST "${BASE}/campaign-briefs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  -d '{"accountId":"3fa85f64-5717-4562-b3fc-2c963f66afa6","title":"Probe A title","objective":"Objective with ten+ chars."}'
```

**B — `POST` with uppercase tag:**

```bash
curl -sS -w "\nHTTP %{http_code}\n" -X POST "${BASE}/campaign-briefs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountId":"3fa85f64-5717-4562-b3fc-2c963f66afa6","title":"Probe B title","objective":"Objective with ten+ chars.","tags":["DACH"]}'
```

**C — `GET` with invalid `accountId`:**

```bash
curl -sS -w "\nHTTP %{http_code}\n" "${BASE}/campaign-briefs?accountId=not-a-uuid&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**D — `GET` page 2 (count `items` vs `pageSize`):**

```bash
curl -sS "${BASE}/campaign-briefs?accountId=3fa85f64-5717-4562-b3fc-2c963f66afa6&page=2&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## If something fails

- **401 / Unauthorized:** Check that the **`Authorization`** header matches the token the interviewer gave you (no extra spaces; **`Bearer `** prefix).
- **Connection refused:** Confirm the **host**, **port**, and whether you were asked to run the server locally.
- **Tests cannot read the token:** Ensure **`INTERVIEW_API_TOKEN`** is set in **`.env`** at the project root or exported in the shell before running Vitest—using the value from the interview.

---

## Language

The interview is conducted in **English** (or as agreed with your recruiter). Ask your **interviewer** for factual clarifications (URLs, tokens, time checks) whenever you need to.
