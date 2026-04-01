/**
 * Starter for live automation — extend with cases from openapi.yaml and your exercise brief.
 *
 * Env: INTERVIEW_API_TOKEN; optional API_BASE (default http://localhost:8080/v1).
 * Run mock: npm start (other terminal). Run tests: npm run test:api-example
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE = process.env.API_BASE ?? 'http://localhost:8080/v1';
const TOKEN = process.env.INTERVIEW_API_TOKEN;

beforeAll(() => {
  if (!TOKEN) {
    throw new Error(
      'Set INTERVIEW_API_TOKEN (.env or export). Remote: API_BASE=https://host/v1'
    );
  }
});

describe('Campaign Briefs API', () => {
  /** Axios instance with Bearer + JSON; validateStatus accepts all codes so you can assert on res.status */
  const api = axios.create({
    baseURL: BASE,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });

  it('starter: replace with real cases from the OpenAPI contract', () => {
    expect(api.defaults.baseURL).toBe(BASE);
  });

  // Add tests, e.g. (accountId: seeded UUID from README / openapi examples):
  // await api.post('/campaign-briefs', { accountId: '3fa85f64-5717-4562-b3fc-2c963f66afa6', title: `…${Date.now()}`, objective: '…' })
  // await api.get('/campaign-briefs', { params: { accountId: '…', page: 1, pageSize: 10 } })
  // Unauthenticated: axios.get(`${BASE}/campaign-briefs`, { params: { … }, validateStatus: () => true })

  it.todo('POST valid body → 201 and required response fields');
  it.todo('GET list → 200 and pagination shape');
  it.todo('missing or invalid auth → 401');
  it.todo('invalid body (e.g. validation) → 400');
});
