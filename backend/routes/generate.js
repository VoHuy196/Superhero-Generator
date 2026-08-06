/**
 * Generate route - Face-Preserving Superhero Generation
 *
 * Strategy:
 *   1. Try fal.ai FLUX Kontext (best quality if balance available)
 *   2. Upload image to temporary host (tmpfiles.org) to obtain a clean public URL
 *   3. Call Pollinations.ai img2img with the short public URL (bypassing 414 Header Too Large)
 *   4. Fallback to Pollinations.ai text2img if needed
 *
 * POST /api/generate
 * Body: { imageBase64: string, mimeType: string, name: string }
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { fal } = require('@fal-ai/client');
const { addLog } = require('../utils/logger');
const { uploadToTmpFiles } = require('../utils/uploader');

// Configure fal.ai client if key exists
fal.config({ credentials: process.env.FAL_KEY || '' });

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

/**
 * Build superhero transformation prompt for img2img
 */
function buildSuperheroPrompt(name) {
  return `Marvel superhero transformation of the person in the reference image. ` +
    `CRITICAL REQUIREMENT: Preserve the exact same face, facial features, facial structure, skin tone, and eyes from the reference photo. ` +
    `Add an epic superhero suit for "${name}" with glowing power aura, metallic armor plating, dynamic cape. ` +
    `Cinematic lighting, high detail Marvel movie poster style, 8k resolution, heroic stance, cityscape background.`;
}

const NEGATIVE_PROMPT =
  'different face, changed facial features, wrong face, altered facial structure, ' +
  'blurry, low quality, bad anatomy, extra limbs, deformed, watermark, bad skin';

// ─── Provider 1: fal.ai FLUX Kontext ──────────────────────────────────────────

async function generateWithFalKontext(imageBase64, mimeType, name) {
  console.log(`[GENERATE] Provider: fal.ai FLUX Kontext`);

  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const imageBlob = new Blob([imageBuffer], { type: mimeType || 'image/jpeg' });
  const imageFile = new File([imageBlob], 'input.jpg', { type: mimeType || 'image/jpeg' });

  const imageUrl = await fal.storage.upload(imageFile);
  console.log(`[GENERATE] Uploaded to fal storage: ${imageUrl}`);

  const prompt = buildSuperheroPrompt(name);
  const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext', {
    input: {
      prompt,
      image_url: imageUrl,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      output_format: 'jpeg',
    },
    logs: false,
  });

  const outputUrl = result?.data?.images?.[0]?.url;
  if (!outputUrl) throw new Error('No output image URL returned by fal.ai');

  const base64 = await downloadAsBase64(outputUrl);
  return {
    base64,
    mimeType: 'image/jpeg',
    provider: 'fal.ai FLUX Kontext (img2img – face preserving)',
  };
}

// ─── Provider 2: Pollinations img2img with hosted URL ────────────────────────

async function generateWithPollinationsImg2Img(publicImageUrl, name) {
  return new Promise((resolve, reject) => {
    console.log(`[GENERATE] Provider: Pollinations.ai img2img (ref: ${publicImageUrl})`);
    const prompt = buildSuperheroPrompt(name);
    const seed = Math.floor(Math.random() * 999999);

    const params = new URLSearchParams({
      imageUrl: publicImageUrl, // short public URL from tmpfiles.org
      width: '1024',
      height: '1024',
      model: 'flux',
      seed: String(seed),
      nologo: 'true',
      enhance: 'true',
      negative_prompt: NEGATIVE_PROMPT,
    });

    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
    console.log(`[GENERATE] Requesting Pollinations img2img URL...`);

    const doGet = (targetUrl) => {
      const proto = targetUrl.startsWith('https') ? https : http;
      const req = proto.get(targetUrl, { timeout: 120000 }, (res) => {
        if ([301, 302].includes(res.statusCode) && res.headers.location) {
          return doGet(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Pollinations HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length < 5000) {
            return reject(new Error(`Image response too small (${buf.length}B) - likely an error page`));
          }
          console.log(`[GENERATE] Pollinations img2img received: ${buf.length} bytes`);
          resolve({
            base64: buf.toString('base64'),
            mimeType: (res.headers['content-type'] || 'image/jpeg').split(';')[0],
            provider: 'Pollinations.ai FLUX img2img (face reference)',
          });
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Pollinations timeout after 120s')); });
    };
    doGet(url);
  });
}

// ─── Provider 3: Pollinations text2img (Fallback) ────────────────────────────

function generateWithPollinationsText(name) {
  return new Promise((resolve, reject) => {
    console.log(`[GENERATE] Provider: Pollinations.ai text2img (fallback)`);
    const prompt = `Epic Marvel superhero portrait for "${name}", superhero costume with glowing energy, cape, metallic armor, cinematic lighting, 8k resolution.`;
    const seed = Math.floor(Math.random() * 999999);
    const params = new URLSearchParams({
      width: '1024',
      height: '1024',
      model: 'flux',
      seed: String(seed),
      nologo: 'true',
      enhance: 'true',
    });
    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params}`;

    const doGet = (targetUrl) => {
      const proto = targetUrl.startsWith('https') ? https : http;
      const req = proto.get(targetUrl, { timeout: 120000 }, (res) => {
        if ([301, 302].includes(res.statusCode)) return doGet(res.headers.location);
        if (res.statusCode !== 200) return reject(new Error(`Pollinations HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({
            base64: buf.toString('base64'),
            mimeType: (res.headers['content-type'] || 'image/jpeg').split(';')[0],
            provider: 'Pollinations.ai FLUX text2img (fallback)',
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

function downloadAsBase64(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { timeout: 30000 }, res => {
      if (res.statusCode !== 200) return reject(new Error(`Download HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ─── POST /api/generate ───────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const startTime = Date.now();
  const { imageBase64, mimeType, name } = req.body;

  if (!imageBase64 || !name) {
    return res.status(400).json({ error: 'Missing imageBase64 or name' });
  }

  let result = null;
  const prompt = buildSuperheroPrompt(name);

  console.log(`\n[GENERATE] ── Start generation for: "${name}" ──────────────────────────`);

  // 1. Try fal.ai FLUX Kontext if key is set
  if (process.env.FAL_KEY) {
    try {
      result = await generateWithFalKontext(imageBase64, mimeType, name);
    } catch (falErr) {
      console.warn(`[GENERATE] fal.ai skipped/failed (${falErr.message}). Switching to Pollinations img2img...`);
    }
  }

  // 2. Pollinations img2img via tmpfiles hosted URL
  if (!result) {
    try {
      console.log(`[GENERATE] Step: Hosting input image on tmpfiles.org...`);
      const publicImageUrl = await uploadToTmpFiles(imageBase64, mimeType || 'image/jpeg');
      console.log(`[GENERATE] Input hosted at: ${publicImageUrl}`);
      
      result = await generateWithPollinationsImg2Img(publicImageUrl, name);
    } catch (pImg2ImgErr) {
      console.warn(`[GENERATE] Pollinations img2img failed (${pImg2ImgErr.message}). Switching to text2img fallback...`);
    }
  }

  // 3. Fallback text2img
  if (!result) {
    result = await generateWithPollinationsText(name);
  }

  const latency = Date.now() - startTime;

  addLog({
    prompt,
    httpStatus: 200,
    latency,
    error: null,
    config: { provider: result.provider },
  });

  console.log(`[GENERATE] ✅ Successfully generated via "${result.provider}" in ${latency}ms\n`);

  return res.json({
    success: true,
    imageBase64: result.base64,
    mimeType: result.mimeType,
    latency,
    provider: result.provider,
  });
});

module.exports = router;
