// const express = require('express');
// const fs = require('fs');
// const crypto = require('crypto');
// const axios = require('axios');
// const FormData = require('form-data');
// require('dotenv').config();

// const router = express.Router();
// const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

// const scanQueue = [];
// let scanCount = 0;
// let scanningInProgress = false;

// // Reset scan counter every minute
// setInterval(() => {
//   scanCount = 0;
// }, 60 * 1000);

// // Compute SHA256 of file
// function computeFileHash(filePath) {
//   return new Promise((resolve, reject) => {
//     const hash = crypto.createHash('sha256');
//     const stream = fs.createReadStream(filePath);
//     stream.on('error', reject);
//     stream.on('data', chunk => hash.update(chunk));
//     stream.on('end', () => resolve(hash.digest('hex')));
//   });
// }

// async function checkHashBeforeUpload(hash, apiKey) {
//   try {
//     const response = await axios.get(`https://www.virustotal.com/api/v3/files/${hash}`, {
//       headers: { "x-apikey": apiKey }
//     });
//     return response.data;
//   } catch (err) {
//     if (err.response && err.response.status === 404) {
//       return null; // File not found, safe to upload
//     }
//     throw err;
//   }
// }
// // Process queue one by one
// async function processNextInQueue() {
//   if (scanningInProgress || scanCount >= 3 || scanQueue.length === 0) return;

//   scanningInProgress = true;
//   const { filePath, res } = scanQueue.shift();
//   scanCount++;

//   try {
//     console.log(`🔍 Scanning started: ${filePath}`);

//     const fileHash = await computeFileHash(filePath);
//     console.log(`📁 File Hash (SHA256): ${fileHash}`);

//     let stats = null;

//     // Try cached result
//     try {
//       const cached = await axios.get(`https://www.virustotal.com/api/v3/files/${fileHash}`, {
//         headers: { 'x-apikey': VIRUSTOTAL_API_KEY }
//       });

//       if (cached?.data?.data?.attributes?.status === "completed") {
//         stats = cached.data.data.attributes.stats;
//         console.log(`✅ Cached result used:`, stats);
//       }
//     } catch (e) {
//       if (e.response?.status !== 404) throw e;
//     }

//     // If no cache, upload and poll
//     if (!stats) {
//       const form = new FormData();
//       form.append('file', fs.createReadStream(filePath));

//       const upload = await axios.post('https://www.virustotal.com/api/v3/files', form, {
//         headers: {
//           'x-apikey': VIRUSTOTAL_API_KEY,
//           ...form.getHeaders()
//         }
//       });

//       const analysisId = upload.data.data.id;
//       console.log(`🆕 File uploaded, analysis ID: ${analysisId}`);

//       // Poll every 50 sec (up to 3 tries = ~2.5 mins max)
//       for (let attempt = 0; attempt < 3; attempt++) {
//         await new Promise(r => setTimeout(r, 50000)); // 50 sec
//         const result = await axios.get(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
//           headers: { 'x-apikey': VIRUSTOTAL_API_KEY }
//         });

//         if (result.data.data.attributes.status === "completed") {
//           stats = result.data.data.attributes.stats;
//           break;
//         }
//       }

//       if (!stats) throw new Error("Timeout: analysis not completed");
//     }

//     // Result decision
//     const isMalicious = stats.malicious > 0 || stats.suspicious > 0;

//     if (isMalicious) {
//       console.log(`🚫 MALICIOUS FILE: ${filePath} | Deleting...`);
//       fs.unlinkSync(filePath);
//       res.json({ status: "malicious", deleted: true, stats });
//     } else {
//       console.log(`🟢 SAFE FILE: ${filePath}`);
//       res.json({ status: "clean", deleted: false, stats });
//     }

//   } catch (err) {
//     console.error(`❗Scan failed for ${filePath}:`, err.message);
//     res.status(500).json({ error: "Scan failed", message: err.message });
//   } finally {
//     scanningInProgress = false;
//     processNextInQueue(); // Trigger next in queue
//   }
// }

// // POST /scan-file
// router.post('/scan-file', (req, res) => {
//   const { filePath } = req.body;

//   if (!filePath || !fs.existsSync(filePath)) {
//     return res.status(400).json({ error: "Invalid or missing filePath" });
//   }

//   scanQueue.push({ filePath, res });
//   console.log(`📦 Added to queue: ${filePath} | Queue Length: ${scanQueue.length}`);

//   processNextInQueue(); // Trigger if idle
// });

// module.exports = router;
