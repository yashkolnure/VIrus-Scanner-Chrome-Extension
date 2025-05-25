FILESAFE - Chrome Extension + FILESAFEBACKEND - VirusTotal Scanner API
====================================================================

This project consists of two parts:

1. FILESAFE - A Chrome extension that detects new downloads and sends the downloaded file path to the backend for virus scanning.
2. FILESAFEBACKEND - An Express.js API backend that scans files using the VirusTotal API to detect malicious content.

---

FILESAFE Chrome Extension
-------------------------
- Monitors Chrome downloads.
- On every new download, it extracts the file path.
- Sends the file path to the backend API (`FILESAFEBACKEND`) for scanning.
- Communicates with the backend via POST requests.

Setup & Installation:
1. Open Chrome and go to `chrome://extensions`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select the `FILESAFE` folder.
4. The extension will now monitor downloads automatically.

Note: Make sure Chrome has permission to access download file paths (may require enabling "Allow access to file URLs" for this extension).

---

FILESAFEBACKEND - VirusTotal File Scanner API
---------------------------------------------
This Express.js backend scans files with VirusTotal, queues scan requests, rate-limits them, and responds with scan results.

Features:
- Computes SHA256 hash of files.
- Checks VirusTotal cache before uploading files.
- Uploads and scans files if no cached results.
- Queues scanning requests to avoid hitting API limits.
- Automatically deletes malicious files.
- Returns detailed JSON results.

Prerequisites:
- Node.js (v14+ recommended)
- VirusTotal API key (https://www.virustotal.com)

Setup:
1. Navigate to the `FILESAFEBACKEND` folder.
2. Create a `.env` file with your VirusTotal API key:
   
   VIRUSTOTAL_API_KEY=your_api_key_here

3. Install dependencies:

   npm install

4. Start the server:

   node index.js

API Endpoint:
POST /api/scan-file

Request body:
{
  "filePath": "/absolute/path/to/file"
}

Responses:
- Clean file result, malicious file result, or error JSON (see below).

---

How FILESAFE and FILESAFEBACKEND work together
---------------------------------------------
- When a file finishes downloading, the extension sends the absolute file path to the backend API.
- The backend queues the scan request and processes it, respecting VirusTotal API rate limits.
- Scan results are sent back to the extension or logged (depending on your extension implementation).
- Malicious files are deleted automatically by the backend.

---

Example API Response (Clean file):
{
  "status": "clean",
  "deleted": false,
  "stats": {
    "harmless": 70,
    "malicious": 0,
    "suspicious": 0,
    "undetected": 5,
    "timeout": 0
  }
}

Example API Response (Malicious file):
{
  "status": "malicious",
  "deleted": true,
  "stats": {
    "harmless": 10,
    "malicious": 5,
    "suspicious": 2,
    "undetected": 0,
    "timeout": 0
  }
}

Error Response:
{
  "error": "Scan failed",
  "message": "Error details here"
}

---

Usage Notes
-----------
- The backend limits scans to 3 files per minute due to API rate limiting.
- Ensure the backend has read permissions for the files to be scanned.
- The file paths sent by the extension must be absolute and accessible by the backend.
- For development, ensure CORS is handled correctly if the extension and backend are on different origins.

---

License
-------
MIT License

---

Feel free to customize this README as needed!

---

If you want, I can also help you draft the `manifest.json` and extension background script for `FILESAFE` that sends the download info to `FILESAFEBACKEND`. Just ask!
