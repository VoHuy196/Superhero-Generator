/**
 * Generate route - Two-Stage Superhero Generation
 *
 * Stage 1: Google Gemini Vision AI reads and understands the user's photo,
 *          analyzing face & physical features, and generates an optimized superhero prompt.
 *
 * Stage 2: Pollinations AI (with API key) receives the prompt
 *          and generates the high-quality superhero image with STRICT face preservation directives.
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

// Initialize Gemini SDK with API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_VISION_MODEL = 'gemini-2.0-flash';

// Pollinations API endpoint & key
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY || 'sk_kjRaZacOX9AgPJ86FJjXBS4bxn7Cz2kc';

/**
 * Stage 1: Use Gemini Vision AI to analyze the user photo and build a detailed superhero prompt
 */
async function generatePromptWithGeminiVision(imageBase64, mimeType, name) {
  console.log(`[GEMINI VISION] Analyzing photo for "${name}"...`);

  const visionSystemPrompt = `You are an expert AI prompt engineer for image generation models (FLUX / Stable Diffusion).
Look closely at this person's photo and analyze their physical appearance and facial features in detail.

Your task: Create a comprehensive, vivid AI image generation prompt that transforms this exact person into an epic Marvel-style Superhero named "${name}".

STRICT MANDATORY RULES FOR YOUR OUTPUT PROMPT:
1. ALWAYS start with the instruction: "ALWAYS preserve the exact same face, eyes, skin tone, facial structure, and expression from the reference image 100% unchanged, and seamlessly place/blend this exact face onto a superhero body."
2. Detail their exact face and physical appearance (face shape, skin tone, eye color/shape, hair color & style, jawline, expression) so the generated image matches their identity.
3. Design an impressive Marvel-style superhero costume for "${name}" featuring metallic armor plating, vibrant superhero suit, flowing cape, and glowing energy/power aura (lightning or cosmic energy).
4. Specify cinematic lighting, heroic posture, dynamic composition, dramatic city skyline background at dusk/night, 8k resolution, photorealistic concept art.
5. Output ONLY the raw image generation prompt in English. Do NOT add any preamble, markdown code blocks, titles, or quotes.`;

  const response = await ai.models.generateContent({
    model: GEMINI_VISION_MODEL,
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
          { text: visionSystemPrompt },
        ],
      },
    ],
  });

  const generatedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  if (!generatedPrompt) {
    throw new Error('Gemini Vision returned an empty prompt response.');
  }

  console.log(`[GEMINI VISION] Generated Prompt successfully (${generatedPrompt.length} chars):`);
  console.log(`"${generatedPrompt}"`);
  return generatedPrompt;
}

/**
 * Stage 2: Call Pollinations AI to generate the superhero image using the prompt
 */
async function generateImageWithPollinations(prompt, publicImageUrl = null) {
  return new Promise((resolve, reject) => {
    console.log(`[POLLINATIONS AI] Sending request to Pollinations API...`);
    const seed = Math.floor(Math.random() * 999999);

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

    // Pass hosted reference URL to Pollinations img2img to assist face preservation
    if (publicImageUrl) {
      params.append('imageUrl', publicImageUrl);
    }

    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
    console.log(`[POLLINATIONS AI] Endpoint: ${url.substring(0, 120)}...`);

    const doGet = (targetUrl) => {
      const proto = targetUrl.startsWith('https') ? https : http;
      const headers = {
        'User-Agent': 'SuperheroGenerator/1.0',
      };
      if (POLLINATIONS_KEY) {
        headers['Authorization'] = `Bearer ${POLLINATIONS_KEY}`;
        headers['x-api-key'] = POLLINATIONS_KEY;
      }

      const req = proto.get(targetUrl, { headers, timeout: 120000 }, (res) => {
        if ([301, 302].includes(res.statusCode) && res.headers.location) {
          return doGet(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Pollinations API HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (buffer.length < 5000) {
            return reject(new Error(`Pollinations returned invalid image buffer (${buffer.length} bytes)`));
          }
          console.log(`[POLLINATIONS AI] Received image (${buffer.length} bytes)`);
          const base64 = buffer.toString('base64');
          const contentType = (res.headers['content-type'] || 'image/jpeg').split(';')[0];
          resolve({ base64, mimeType: contentType });
        });
        res.on('error', reject);
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Pollinations API request timed out after 120 seconds'));
      });
    };

    doGet(url);
  });
}

/**
 * Fallback prompt creator if Gemini Vision encounters rate limits or temporary errors
 */
function createFallbackPrompt(name) {
  return `Keep the exact original face and facial features 100% unchanged from the reference image, and seamlessly blend/place this face onto an epic Marvel superhero costume for "${name}". ` +
    `Detailed human face, heroic facial expression, athletic build. ` +
    `High-tech metallic superhero suit with glowing energy lines, flowing cape, dynamic power aura. ` +
    `Dramatic cinematic lighting, superhero pose, glowing city skyline background, 8k concept art.`;
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

  console.log(`\n[GENERATE] ── Starting 2-Stage Generation for: "${name}" ──────────────────────────`);

  let geminiPrompt = '';
  let visionSource = 'Google Gemini 2.0 Vision AI';

  try {
    // ── STAGE 1: Gemini Vision reads photo & crafts superhero prompt ─────
    try {
      geminiPrompt = await generatePromptWithGeminiVision(imageBase64, mimeType, name);
    } catch (visionErr) {
      console.warn(`[GENERATE WARNING] Gemini Vision reading failed (${visionErr.message}). Using fallback prompt.`);
      geminiPrompt = createFallbackPrompt(name);
      visionSource = 'Fallback Prompt Generator';
    }

    // ── Enforce Mandatory Face Preservation & Superhero Blend Directive ─────
    const mandatoryDirective = `ALWAYS KEEP THE EXACT SAME FACE AND FACIAL FEATURES FROM THE REFERENCE IMAGE 100% UNCHANGED, AND SEAMLESSLY BLEND THIS FACE ONTO A SUPERHERO SUIT:`;
    
    // Check if directive is already present, if not prepended to guarantee consistency
    const finalPrompt = geminiPrompt.includes('ALWAYS') || geminiPrompt.includes('preserve')
      ? geminiPrompt
      : `${mandatoryDirective} ${geminiPrompt}`;

    // ── Host image on tmpfiles.org for reference ──────────────────────────
    let publicImageUrl = null;
    try {
      publicImageUrl = await uploadToTmpFiles(imageBase64, mimeType || 'image/jpeg');
      console.log(`[GENERATE] Hosted input photo for reference: ${publicImageUrl}`);
    } catch (uploadErr) {
      console.warn(`[GENERATE WARNING] Host upload skipped: ${uploadErr.message}`);
    }

    // ── STAGE 2: Pollinations AI generates image using the final prompt ────
    const imageResult = await generateImageWithPollinations(finalPrompt, publicImageUrl);

    const latency = Date.now() - startTime;
    const provider = `${visionSource} ➔ Pollinations AI (FLUX)`;

    // Log to Log Viewer
    addLog({
      prompt: finalPrompt,
      httpStatus: 200,
      latency,
      error: null,
      config: { provider, pollinationsKeyUsed: !!POLLINATIONS_KEY },
    });

    console.log(`[GENERATE] ✅ Complete! Latency: ${latency}ms\n`);

    return res.json({
      success: true,
      imageBase64: imageResult.base64,
      mimeType: imageResult.mimeType,
      latency,
      provider,
      prompt: finalPrompt,
    });

  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`[GENERATE ERROR] ${err.message}\n`);

    addLog({
      prompt: geminiPrompt || `[Stage 1 Failed] name=${name}`,
      httpStatus: 500,
      latency,
      error: err.message,
      config: { provider: 'Failed' },
    });

    return res.status(500).json({
      success: false,
      error: err.message,
      latency,
    });
  }
});

module.exports = router;
