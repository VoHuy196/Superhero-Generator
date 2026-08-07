require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  'gemini-3.0-pro-image',
  'gemini-3-pro-image',
  'gemini-2.5-pro-image',
  'gemini-2.5-pro-preview-06-05',
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-preview-image-generation',
];

// 1x1 pixel valid PNG
const sampleImg = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

(async () => {
  for (const model of models) {
    try {
      const r = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'image/png', data: sampleImg } },
          { text: 'Transform this into a superhero. Keep exact face.' }
        ]}],
        config: { responseModalities: ['TEXT', 'IMAGE'] }
      });
      const parts = r.candidates?.[0]?.content?.parts || [];
      const hasImg = parts.some(p => p.inlineData);
      const txt = parts.find(p => p.text)?.text?.substring(0, 60) || '';
      console.log(`✅ ${model} => hasImage:${hasImg} text:"${txt}"`);
    } catch (e) {
      const msg = typeof e.message === 'string' ? e.message : JSON.stringify(e.message);
      const code = msg.match(/"code":(\d+)/)?.[1] || '?';
      const status = msg.match(/"status":"([^"]+)"/)?.[1] || msg.substring(0, 60);
      console.log(`❌ ${model} => HTTP ${code} ${status}`);
    }
  }
})();
