/**
 * Generate route - Superhero Generation
 *
 * Model: gemini-2.5-flash-image ("Nano Banana") - primary
 * Fallback: Pollinations AI FLUX - when Gemini is unavailable (503/429)
 *
 * POST /api/generate
 * Body: { imageBase64: string, mimeType: string, name: string }
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { GoogleGenAI } = require('@google/genai');
const { addLog } = require('../utils/logger');
const { uploadToTmpFiles } = require('../utils/uploader');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_PRO_MODEL   = 'gemini-3-pro-image';    // Nano Banana Pro (primary)
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash-image'; // Nano Banana (secondary fallback)
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY || '';

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(name) {
  return `Transform this person named "${name}" into an epic Marvel-style Superhero.
MANDATORY REQUIREMENTS:
1. ALWAYS keep the exact same face, eyes, skin tone, facial features, and facial structure from the input photo 100% unchanged and identical.
2. Seamlessly blend and attach this exact face onto a superhero body.
3. Design an awesome superhero costume for "${name}" with high-tech metallic armor plates, glowing energy aura (lightning/cosmic), flowing cape, and heroic stance.
4. Cinematic lighting, city skyline background at night, 8k resolution, Marvel concept art style.`;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

/**
 * Retry an async function with exponential backoff.
 * Only retries on 503 (server overloaded) or 429 (rate limit).
 */
async function withRetry(fn, { maxRetries = 3, baseDelayMs = 3000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
      const isRetryable = msg.includes('503') || msg.includes('UNAVAILABLE') ||
                          msg.includes('429') || msg.includes('rate') ||
                          msg.includes('overloaded') || msg.includes('high demand');

      if (!isRetryable || attempt === maxRetries) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 3s, 6s, 12s
      console.warn(`[RETRY] Attempt ${attempt}/${maxRetries} failed (${msg.substring(0, 80)}). Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      lastErr = err;
    }
  }
  throw lastErr;
}

// ─── Provider 1: Gemini 2.5 Flash Image ("Nano Banana") ──────────────────────

async function generateWithGemini(imageBase64, mimeType, name) {
  const prompt = buildPrompt(name);

  // Try Pro model first, then Flash as inner fallback
  const candidates = [
    { model: GEMINI_PRO_MODEL,   label: 'Nano Banana Pro (gemini-3-pro-image)' },
    { model: GEMINI_FLASH_MODEL, label: 'Nano Banana (gemini-2.5-flash-image)' },
  ];

  for (const { model, label } of candidates) {
    try {
      console.log(`[GEMINI] Calling ${label}...`);
      const response = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
            { text: prompt },
          ],
        }],
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });

      let resultBase64 = null;
      let resultMime = 'image/png';
      for (const part of (response.candidates?.[0]?.content?.parts || [])) {
        if (part.inlineData) {
          resultBase64 = part.inlineData.data;
          resultMime = part.inlineData.mimeType || 'image/png';
          break;
        }
      }

      if (!resultBase64) throw new Error('No image data in response');

      console.log(`[GEMINI] ✅ Image generated via ${label}`);
      return { base64: resultBase64, mimeType: resultMime, prompt, provider: label };

    } catch (err) {
      const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
      console.warn(`[GEMINI] ${label} failed: ${msg.substring(0, 100)}`);
      // Only retry next model if overloaded or rate-limited
      const isRetryable = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
      if (!isRetryable) throw err; // hard error, don't try next model
    }
  }

  throw new Error('All Gemini models unavailable');
}

// ─── Provider 2: Pollinations AI (fallback) ───────────────────────────────────

function generateWithPollinations(imageBase64, mimeType, name) {
  return new Promise(async (resolve, reject) => {
    console.log(`[POLLINATIONS] Running FLUX img2img as fallback...`);
    const prompt = buildPrompt(name);
    const seed = Math.floor(Math.random() * 999999);

    let publicUrl = null;
    try {
      publicUrl = await uploadToTmpFiles(imageBase64, mimeType || 'image/jpeg');
      console.log(`[POLLINATIONS] Image hosted at: ${publicUrl}`);
    } catch (e) {
      console.warn(`[POLLINATIONS] Host upload failed: ${e.message}`);
    }

    const params = new URLSearchParams({
      width: '1024', height: '1024', model: 'flux',
      seed: String(seed), nologo: 'true', enhance: 'true',
      negative_prompt: 'different face, wrong face, altered face, blurry, deformed, watermark',
    });
    if (publicUrl) params.append('imageUrl', publicUrl);

    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params}`;
    const headers = { 'User-Agent': 'SuperheroGenerator/1.0' };
    if (POLLINATIONS_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_KEY}`;
      headers['x-api-key'] = POLLINATIONS_KEY;
    }

    const doGet = (targetUrl) => {
      const proto = targetUrl.startsWith('https') ? https : http;
      const req = proto.get(targetUrl, { headers, timeout: 120000 }, (res) => {
        if ([301, 302].includes(res.statusCode) && res.headers.location) return doGet(res.headers.location);
        if (res.statusCode !== 200) return reject(new Error(`Pollinations HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length < 5000) return reject(new Error(`Invalid image (${buf.length}B)`));
          console.log(`[POLLINATIONS] ✅ Received ${buf.length} bytes.`);
          resolve({
            base64: buf.toString('base64'),
            mimeType: (res.headers['content-type'] || 'image/jpeg').split(';')[0],
            prompt,
            provider: 'Pollinations AI FLUX (fallback – Gemini unavailable)',
          });
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Pollinations timeout')); });
    };
    doGet(url);
  });
}

// ─── POST /api/generate ───────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const startTime = Date.now();
  const { imageBase64, mimeType, name } = req.body;

  if (!imageBase64 || !name) {
    return res.status(400).json({ error: 'Missing imageBase64 or name' });
  }

  console.log(`\n[GENERATE] ── "${name}" ──────────────────────────────────────────`);

  let result = null;

  // ── Priority 1: Gemini 2.5 Flash Image with auto-retry ──────────────────
  try {
    result = await withRetry(
      () => generateWithGemini(imageBase64, mimeType, name),
      { maxRetries: 3, baseDelayMs: 3000 }
    );
  } catch (geminiErr) {
    console.warn(`[GENERATE] Gemini failed after retries: ${geminiErr.message.substring(0, 120)}`);
    console.warn(`[GENERATE] Switching to Pollinations fallback...`);
  }

  // ── Priority 2: Pollinations AI fallback ────────────────────────────────
  if (!result) {
    try {
      result = await generateWithPollinations(imageBase64, mimeType, name);
    } catch (polErr) {
      const latency = Date.now() - startTime;
      console.error(`[GENERATE] ❌ All providers failed: ${polErr.message}`);
      addLog({ prompt: buildPrompt(name), httpStatus: 500, latency, error: polErr.message, config: { provider: 'all-failed' } });
      return res.status(500).json({ success: false, error: polErr.message, latency });
    }
  }

  const latency = Date.now() - startTime;
  addLog({ prompt: result.prompt, httpStatus: 200, latency, error: null, config: { model: GEMINI_PRO_MODEL, provider: result.provider } });
  console.log(`[GENERATE] ✅ Done via "${result.provider}" in ${latency}ms\n`);

  return res.json({
    success: true,
    imageBase64: result.base64,
    mimeType: result.mimeType,
    latency,
    provider: result.provider,
    prompt: result.prompt,
  });
});

module.exports = router;
