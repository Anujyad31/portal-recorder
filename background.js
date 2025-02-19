let recordingTabId = null;
let networkRequests = [];

// Reset storage on extension install
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension storage cleared")
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

// Start recording logic
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "captureNetwork") {
        recordingTabId = message.tabId;
        networkRequests = [];
    } else if (message.action === "stopCaptureNetwork") {
        chrome.storage.local.set({ networkRequests: networkRequests});
    }
});