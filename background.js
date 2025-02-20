importScripts('jszip.min.js');

let recordingTabId = null;
let networkRequests = [];

// Reset storage on extension install
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension storage cleared");
    chrome.storage.local.clear();
});

// Capture network requests
chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.tabId === recordingTabId) {
            networkRequests.push({
                url: details.url,
                method: details.method,
                status: details.statusCode,
                timeStamp: details.timeStamp
            });
        }
    },
    { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "captureNetwork") {
        recordingTabId = message.tabId;
        networkRequests = [];
    } else if (message.action === "stopCaptureNetwork") {
        chrome.storage.local.set({ networkRequests: networkRequests });
    } else if (message.action === "exportData") {
        exportData();
    }
});

// Create ZIP and trigger download
async function exportData() {
    const zip = new JSZip();
    
    const { recordingBlob } = await chrome.storage.local.get("recordingBlob");
    const { networkRequests } = await chrome.storage.local.get("networkRequests");

    if (recordingBlob) {
        const arrayBuffer = base64ToArrayBuffer(recordingBlob);
        const blob = new Blob([arrayBuffer], { type: "video/webm" });
        zip.file("recording.webm", blob);
    }

    if (networkRequests) {
        const networkBlob = new Blob([JSON.stringify(networkRequests, null, 2)], { type: "application/json" });
        zip.file("network_requests.json", networkBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const reader = new FileReader();
    reader.onload = function() {
        const url = reader.result;
        chrome.downloads.download({
            url: url,
            filename: "user_journey.zip"
        });
    };
    reader.readAsDataURL(zipBlob);
}

function base64ToArrayBuffer(base64) {
    const binaryString = self.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}