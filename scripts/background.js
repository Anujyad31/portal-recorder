importScripts('jszip.min.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createAndDownloadZip") {
        createAndDownloadZip(message.files);
    }
});

// Create ZIP and trigger download
async function createAndDownloadZip(filesToZip) {
    debugger
    const zip = new JSZip();
    
    for (const [name, blob] of Object.entries(filesToZip)) {
        zip.file(name, blob);
    }
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    
    chrome.downloads.download({
        url: zipUrl,
        filename: "user_journey.zip"
    });
}