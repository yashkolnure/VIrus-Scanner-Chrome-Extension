const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { computeFileHash } = require('../utils/fileUtils');
const {
  VIRUSTOTAL_API_KEY,
  SCAN_LIMIT_PER_MINUTE,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS
} = require('../constants/config');

const scanQueue = [];
let scanCount = 0;
let scanningInProgress = false;

setInterval(() => scanCount = 0, 60 * 1000); // Reset per minute

async function processNextInQueue() {
  if (scanningInProgress || scanCount >= SCAN_LIMIT_PER_MINUTE || scanQueue.length === 0) return;

  scanningInProgress = true;
  const { filePath, res } = scanQueue.shift();
  scanCount++;

  try {
    console.log(`🔍 Scanning started: ${filePath}`);
    const fileHash = await computeFileHash(filePath);
    console.log(`📁 File Hash (SHA256): ${fileHash}`);

    let stats = null;

    try {
      const cached = await axios.get(`https://www.virustotal.com/api/v3/files/${fileHash}`, {
        headers: { 'x-apikey': VIRUSTOTAL_API_KEY }
      });
      if (cached?.data?.data?.attributes?.status === "completed") {
        stats = cached.data.data.attributes.stats;
        console.log(`✅ Cached result used:`, stats);
      }
    } catch (e) {
      if (e.response?.status !== 404) throw e;
    }

    if (!stats) {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      const upload = await axios.post('https://www.virustotal.com/api/v3/files', form, {
        headers: { 'x-apikey': VIRUSTOTAL_API_KEY, ...form.getHeaders() }
      });

      const analysisId = upload.data.data.id;
      console.log(`🆕 File uploaded, analysis ID: ${analysisId}`);

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        const result = await axios.get(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
          headers: { 'x-apikey': VIRUSTOTAL_API_KEY }
        });

        if (result.data.data.attributes.status === "completed") {
          stats = result.data.data.attributes.stats;
          break;
        }
      }

      if (!stats) throw new Error("Timeout: analysis not completed");
    }

    const isMalicious = stats.malicious > 0 || stats.suspicious > 0;
    if (isMalicious) {
      console.log(`🚫 MALICIOUS FILE: ${filePath} | Deleting...`);
      fs.unlinkSync(filePath);
      res.json({ status: "malicious", deleted: true, stats });
    } else {
      console.log(`🟢 SAFE FILE: ${filePath}`);
      res.json({ status: "clean", deleted: false, stats });
    }
  } catch (err) {
    console.error(`❗Scan failed for ${filePath}:`, err.message);
    res.status(500).json({ error: "Scan failed", message: err.message });
  } finally {
    scanningInProgress = false;
    processNextInQueue();
  }
}

function enqueueScan(filePath, res) {
  scanQueue.push({ filePath, res });
  console.log(`📦 Added to queue: ${filePath} | Queue Length: ${scanQueue.length}`);
  processNextInQueue();
}

module.exports = { enqueueScan };
