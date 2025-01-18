import crypto from 'crypto';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PRIVATE_KEY = process.env.PRIVATE_KEY;

// リレーサーバーのinbox: e.g. https://example.com/inbox
const relayUrl = new URL('');
const domain = 'blog.nagutabby.uk';

async function sendToRelay(activity) {
  const body = JSON.stringify(activity);
  const date = new Date().toUTCString();
  const digest = `SHA-256=${crypto
    .createHash('sha256')
    .update(body)
    .digest('base64')}`;

  const signString = `(request-target): post ${relayUrl.pathname}\n` +
    `host: ${relayUrl.hostname}\n` +
    `date: ${date}\n` +
    `digest: ${digest}`;

  const signature = crypto.sign('sha256', Buffer.from(signString), PRIVATE_KEY);

  const signatureHeader = {
    keyId: `https://${domain}/actor#main-key`,
    algorithm: 'rsa-sha256',
    headers: '(request-target) host date digest',
    signature: signature.toString('base64')
  };

  const options = {
    hostname: relayUrl.hostname,
    port: 443,
    path: relayUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/activity+json',
      'Content-Length': Buffer.byteLength(body),
      'Host': relayUrl.hostname,
      'Date': date,
      'Digest': digest,
      'Signature': Object.entries(signatureHeader)
        .map(([k, v]) => `${k}="${v}"`)
        .join(','),
      'Accept': 'application/activity+json'
    },
    rejectUnauthorized: false
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response body:', data);

        // Handle successful status codes
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Try to parse as JSON if possible, otherwise return the raw response
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve(jsonData);
          } catch (e) {
            // If it's not JSON, return the raw response
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP error! status: ${res.statusCode}, body: ${data}`));
        }
      });
    });

    req.on('error', error => {
      console.error('Request error:', error);
      reject(error);
    });

    console.log('Sending request with activity:', body);
    console.log('Request headers:', options.headers);

    req.write(body);
    req.end();
  });
}

const activity = {
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  "actor": `https://${domain}/actor`,
  "object": "https://www.w3.org/ns/activitystreams#Public",
  "id": `https://${domain}/activities/follow-relay-${Date.now()}`
};

console.log('Starting request...');
sendToRelay(activity)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Request failed:', error.message));
