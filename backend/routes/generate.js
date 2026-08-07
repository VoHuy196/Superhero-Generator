/**
 * Generate route - Superhero Generation using Gemini 2.5 Flash Image ("Nano Banana")
 *
 * Model: gemini-2.5-flash-image (Nickname: "Nano Banana")
 * Capabilities: Native Image-in, Image-out generation & face transformation
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

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini 2.5 Flash Image Model (Nickname: Nano Banana)
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

// Pollinations API endpoint & key
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY || 'sk_kjRaZacOX9AgPJ86FJjXBS4bxn7Cz2kc';

/**
 * Build superhero transformation prompt for Gemini 2.5 Flash Image ("Nano Banana")
 */
function buildNanoBananaPrompt(name) {
  return `Transform this person named "${name}" into an epic Marvel-style Superhero.
CRITICAL MANDATORY REQUIREMENT:
1. ALWAYS keep the exact same face, eyes, skin tone, facial features, and facial structure from the input photo 100% unchanged and identical.
2. Seamlessly blend and attach this exact face onto a superhero body.
3. Design an awesome superhero costume for "${name}" with high-tech metallic armor plates, glowing energy aura (lightning/cosmic), flowing cape, and heroic stance.
4. Cinematic lighting, city skyline background at night, 8k resolution, Marvel concept art style.`;
}

/**
 * Stage 1: Generate image using Gemini 2.5 Flash Image ("Nano Banana")
 */
async function generateWithGeminiNanoBanana(imageBase64, mimeType, name) {
  console.log(`[GEMINI NANO BANANA] Calling gemini-2.5-flash-image model for "${name}"...`);
  const prompt = buildNanoBananaPrompt(name);

  const response = await ai.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  let resultImageBase64 = null;
  let resultMimeType = 'image/png';

  if (response.candidates && response.candidates.length > 0) {
    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        resultImageBase64 = part.inlineData.data;
        resultMimeType = part.inlineData.mimeType || 'image/png';
      }
    }
  }

  if (!resultImageBase64) {
    throw new Error('Gemini 2.5 Flash Image ("Nano Banana") did not return image data.');
  }

  console.log(`[GEMINI NANO BANANA] Generated image successfully!`);
  return {
    base64: resultImageBase64,
    mimeType: resultMimeType,
    prompt,
    provider: 'Google Gemini 2.5 Flash Image ("Nano Banana")',
  };
}

/**
 * Fallback Stage 2: Pollinations AI Image Generation
 */
async function generateWithPollinationsFallback(imageBase64, mimeType, name) {
  return new Promise(async (resolve, reject) => {
    console.log(`[POLLINATIONS FALLBACK] Generating fallback image for "${name}"...`);
    const prompt = buildNanoBananaPrompt(name);
    const seed = Math.floor(Math.random() * 999999);

    // Host input image for reference if possible
    let publicImageUrl = null;
    try {
      publicImageUrl = await uploadToTmpFiles(imageBase64, mimeType || 'image/jpeg');
    } catch (e) {}

    const negativePrompt =
      'different face, changed face, wrong face, altered facial structure, wrong person, ' +
      'blurry, low quality, bad anatomy, extra limbs, deformed, watermark, bad skin, ugly';

    const params = new URLSearchParams({
      width: '1024',
      height: '1024',
      model: 'flux',
      seed: String(seed),
      nologo: 'true',
      enhance: 'true',
      negative_prompt: negativePrompt,
    });

    if (publicImageUrl) {
      params.append('imageUrl', publicImageUrl);
    }

    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
    const doGet = (targetUrl) => {
      const proto = targetUrl.startsWith('https') ? https : http;
      const headers = { 'User-Agent': 'SuperheroGenerator/1.0' };
      if (POLLINATIONS_KEY) {
        headers['Authorization'] = `Bearer ${POLLINATIONS_KEY}`;
        headers['x-api-key'] = POLLINATIONS_KEY;
      }

      const req = proto.get(targetUrl, { headers, timeout: 120000 }, (res) => {
        if ([301, 302].includes(res.statusCode) && res.headers.location) {
          return doGet(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Pollinations HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (buffer.length < 5000) {
            return reject(new Error('Invalid image buffer length'));
          }
          resolve({
            base64: buffer.toString('base64'),
            mimeType: (res.headers['content-type'] || 'image/jpeg').split(';')[0],
            prompt,
            provider: 'Pollinations AI (FLUX Fallback)',
          });
        });
        res.on('error', reject);
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Pollinations timeout'));
      });
    };

    doGet(url);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const startTime = Date.now();
  const { imageBase64, mimeType, name } = req.body;

  if (!imageBase64 || !name) {
    return res.status(400).json({ error: 'Missing imageBase64 or name' });
  }

  console.log(`\n[GENERATE] ── Starting Superhero Generation for: "${name}" ──────────────────────────`);
  console.log(`[GENERATE] Target Model: ${GEMINI_IMAGE_MODEL} ("Nano Banana")`);

  let result = null;

  try {
    // ── Priority 1: Gemini 2.5 Flash Image ("Nano Banana") ──────────────────
    try {
      result = await generateWithGeminiNanoBanana(imageBase64, mimeType, name);
    } catch (nanoBananaErr) {
      console.warn(`[GENERATE WARNING] Gemini 2.5 Flash Image ("Nano Banana") failed (${nanoBananaErr.message}). Switching to Pollinations fallback...`);
    }

    // ── Priority 2: Pollinations AI Fallback ───────────────────────────────
    if (!result) {
      result = await generateWithPollinationsFallback(imageBase64, mimeType, name);
    }

    const latency = Date.now() - startTime;

    // Log to Log Viewer
    addLog({
      prompt: result.prompt,
      httpStatus: 200,
      latency,
      error: null,
      config: { model: GEMINI_IMAGE_MODEL, nickname: 'Nano Banana', provider: result.provider },
    });

    console.log(`[GENERATE] ✅ Complete via "${result.provider}"! Latency: ${latency}ms\n`);

    return res.json({
      success: true,
      imageBase64: result.base64,
      mimeType: result.mimeType,
      latency,
      provider: result.provider,
      prompt: result.prompt,
    });

  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`[GENERATE ERROR] ${err.message}\n`);

    addLog({
      prompt: buildNanoBananaPrompt(name),
      httpStatus: 500,
      latency,
      error: err.message,
      config: { model: GEMINI_IMAGE_MODEL, nickname: 'Nano Banana', provider: 'Failed' },
    });

    return res.status(500).json({
      success: false,
      error: err.message,
      latency,
    });
  }
});

module.exports = router;
