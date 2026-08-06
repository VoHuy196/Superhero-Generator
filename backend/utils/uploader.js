/**
 * Temporary image uploader helper
 * Uploads a base64 image to a temporary public host (tmpfiles.org)
 * so that we get a short public URL to pass to Pollinations img2img.
 */

const https = require('https');

async function uploadToTmpFiles(base64Data, mimeType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="input.${ext}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
      const footer = `\r\n--${boundary}--\r\n`;
      
      const postData = Buffer.concat([
        Buffer.from(header, 'utf8'),
        buffer,
        Buffer.from(footer, 'utf8')
      ]);

      const req = https.request('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postData.length
        },
        timeout: 15000
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.data && json.data.url) {
              // Convert viewer URL to direct download URL (e.g. https://tmpfiles.org/123/img.jpg -> https://tmpfiles.org/dl/123/img.jpg)
              const directUrl = json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
              resolve(directUrl);
            } else {
              reject(new Error('Invalid response from tmpfiles.org'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('tmpfiles.org upload timed out'));
      });

      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { uploadToTmpFiles };
