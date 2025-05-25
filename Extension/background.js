// 📥 Listen for changes to downloads (when download is complete)
chrome.downloads.onChanged.addListener(function (delta) {
  // ✅ Check if the download is completed
  if (delta.state && delta.state.current === "complete") {

    // 🔍 Search for the file info using the download ID
    chrome.downloads.search({ id: delta.id }, function (results) {
      const fileInfo = results[0];
      console.log("Downloaded file:", fileInfo);

      // 🚀 Send the file path to the local server for VirusTotal scanning
      fetch("http://localhost:5000/api/scan-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: fileInfo.filename })
      })
        .then(res => res.json())
        .then(data => {
          console.log("Scan result:", data);

          // 📢 Prepare message based on scan result
          let message = '';
          if (data.status === 'malicious') {
            message = '⚠️ Malicious file detected and deleted!';
          } else if (data.status === 'clean') {
            message = '✅ File is clean!';
          } else if (data.status === 'pending') {
            message = '⏳ Scan is still pending. Please try again later.';
          } else {
            message = '⚠️ Unknown scan status.';
          }

          // 🔔 Show desktop notification with scan result
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png", // 📸 Replace with actual icon file in extension
            title: "VirusTotal Scan Result",
            message: message,
            priority: 2
          });
        })
        .catch(err => {
          console.error("Error sending file:", err);

          // ❌ Show error notification if scan request fails
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Scan Error",
            message: "❌ Failed to scan the downloaded file.",
            priority: 2
          });
        });
    });
  }
});
