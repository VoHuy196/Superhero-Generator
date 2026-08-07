/**
 * Generate route - Superhero Generation using Gemini 2.5 Flash Image ("Nano Banana")
 *
 * POST /api/generate
 * Body: { imageBase64: string, mimeType: string, name: string }
 */

const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { addLog } = require('../utils/logger');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

/**
 * Build superhero transformation prompt
 */
function buildPrompt(name) {
  return `Transform this person named "${name}" into an epic Marvel-style Superhero.

MANDATORY REQUIREMENTS:
1. ALWAYS keep the exact same face, eyes, skin tone, facial features, and facial structure from the input photo 100% unchanged and identical.
2. Seamlessly blend and attach this exact face onto a superhero body.
3. Design an awesome superhero costume for "${name}" with high-tech metallic armor plates, glowing energy aura (lightning/cosmic), flowing cape, and heroic stance.
4. Cinematic lighting, city skyline background at night, 8k resolution, Marvel concept art style.`;
}

/**
 * POST /api/generate
 * Calls Gemini 2.5 Flash Image ("Nano Banana") with image + text in same parts array
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const { imageBase64, mimeType, name } = req.body;

  if (!imageBase64 || !name) {
    return res.status(400).json({ error: 'Missing imageBase64 or name' });
  }

  const prompt = buildPrompt(name);
  console.log(`\n[GENERATE] ── Starting for: "${name}" (Model: ${GEMINI_IMAGE_MODEL} "Nano Banana") ──`);

  try {
    // Standard Multimodal Request: inlineData (image) + text (prompt) in same parts array
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
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract generated image from response
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
      throw new Error('Gemini 2.5 Flash Image ("Nano Banana") did not return image data in response.');
    }

    const latency = Date.now() - startTime;
    const provider = `Gemini 2.5 Flash Image ("Nano Banana")`;

    addLog({ prompt, httpStatus: 200, latency, error: null, config: { model: GEMINI_IMAGE_MODEL, provider } });
    console.log(`[GENERATE] ✅ Done in ${latency}ms\n`);

    return res.json({
      success: true,
      imageBase64: resultImageBase64,
      mimeType: resultMimeType,
      latency,
      provider,
      prompt,
    });

  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`[GENERATE] ❌ Error: ${err.message}\n`);

    addLog({ prompt, httpStatus: 500, latency, error: err.message, config: { model: GEMINI_IMAGE_MODEL } });

    return res.status(500).json({ success: false, error: err.message, latency });
  }
});

module.exports = router;
