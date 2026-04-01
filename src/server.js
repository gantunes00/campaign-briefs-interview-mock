const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 8080;
const TOKEN = process.env.INTERVIEW_API_TOKEN;

if (!TOKEN) {
  console.error('Missing INTERVIEW_API_TOKEN. Copy .env.example to .env and set a token.');
  process.exit(1);
}

/** @type {Array<Record<string, unknown>>} */
const briefs = [];

const SEED_ACCOUNT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

function uuidRegex(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s)
  );
}

function errorResponse(code, message, details = []) {
  return { code, message, details };
}

function seedBriefs() {
  for (let i = 0; i < 25; i += 1) {
    briefs.push({
      id: crypto.randomUUID(),
      accountId: SEED_ACCOUNT_ID,
      title: `Seeded brief ${i + 1}`,
      objective: 'Seeded objective text for pagination testing.',
      status: 'draft',
      tags: ['seed'],
      metadata: { source: 'seed' },
      createdAt: new Date().toISOString()
    });
  }
}

seedBriefs();

const app = express();

// POST JSON only when Content-Type declares application/json
app.use('/v1/campaign-briefs', (req, res, next) => {
  if (req.method === 'POST') {
    const ct = req.headers['content-type'] || '';
    if (!ct.toLowerCase().includes('application/json')) {
      return res.status(415).type('text/plain').send('Unsupported Media Type');
    }
  }
  next();
});

app.use(express.json({ limit: '256kb' }));

function bearerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res
      .status(401)
      .json(errorResponse('UNAUTHORIZED', 'Missing or invalid Authorization header', []));
  }
  const raw = auth.slice(7).trim();
  if (!raw) {
    return res.status(401).type('text/html').send('<!doctype html><title>Unauthorized</title>');
  }
  if (raw !== TOKEN) {
    return res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid token', []));
  }
  next();
}

app.use('/v1', bearerAuth);

app.post('/v1/campaign-briefs', (req, res) => {
  const { accountId, title, objective, tags, metadata } = req.body || {};
  const details = [];

  if (!accountId || !uuidRegex(accountId)) {
    details.push({ path: 'accountId', message: 'must be a valid UUID' });
  }
  if (typeof title !== 'string' || title.length < 3 || title.length > 120) {
    details.push({ path: 'title', message: 'must be a string between 3 and 120 characters' });
  }
  if (typeof objective !== 'string' || objective.length < 10) {
    details.push({ path: 'objective', message: 'must be a string with at least 10 characters' });
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > 5) {
      details.push({ path: 'tags', message: 'must be an array with at most 5 items' });
    } else {
      for (let i = 0; i < tags.length; i += 1) {
        if (typeof tags[i] !== 'string') {
          details.push({ path: `tags[${i}]`, message: 'must be a string' });
        }
      }
    }
  }
  if (metadata !== undefined) {
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      details.push({ path: 'metadata', message: 'must be an object' });
    } else {
      for (const [k, v] of Object.entries(metadata)) {
        if (typeof v !== 'string' && typeof v !== 'object') {
          details.push({ path: `metadata.${k}`, message: 'invalid value type' });
        }
      }
    }
  }

  if (details.length > 0) {
    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Request validation failed', details));
  }

  const brief = {
    id: crypto.randomUUID(),
    accountId,
    title,
    objective,
    status: 'draft',
    tags: Array.isArray(tags) ? tags : undefined,
    metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
    createdAt: new Date().toISOString()
  };
  briefs.push(brief);
  return res.status(201).json(brief);
});

app.get('/v1/campaign-briefs', (req, res) => {
  const { accountId, page: pageRaw, pageSize: pageSizeRaw } = req.query;

  if (!accountId || !uuidRegex(accountId)) {
    console.error('Invalid accountId query:', accountId);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const page = Math.max(1, parseInt(String(pageRaw ?? '1'), 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(String(pageSizeRaw ?? '20'), 10) || 20));

  const forAccount = briefs.filter((b) => b.accountId === accountId);
  const total = forAccount.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize + 1;
  const items = forAccount.slice(start, end);

  return res.status(200).json({
    items,
    page,
    pageSize,
    total
  });
});

app.get('/health', (_req, res) => {
  res.status(200).type('text/plain').send('ok');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Campaign Briefs mock listening on 0.0.0.0:${PORT} (v1 under /v1)`);
});
