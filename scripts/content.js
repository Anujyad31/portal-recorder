let mediaRecorder;
let recordedChunks = [];
let networkLogs = [];
let consoleLogs = [];
// Store files in memory for zipping
let filesToZip = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startRecording") {
        startScreenRecording();
        captureNetworkRequests(message.tabId);
        captureConsoleLogs(message.tabId);
    } else if (message.action === "stopRecording") {
        debugger
        stopScreenRecording();
        stopCapturingLogs();
        chrome.runtime.sendMessage({ action: "createAndDownloadZip", files: filesToZip });
    }
});

// Start screen recording
async function startScreenRecording() {
    console.log("Starting recording");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.error("Screen recording is not supported");
        return;
    }
    let stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { mediaSource: "tab" },
        audio: false,
        preferCurrentTab: true,
     });
     
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.start();
}

// Stop recording and store the file
function stopScreenRecording() {
    mediaRecorder.stop();
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        storeFile("screen_recording.webm", blob);
    };
}

// Capture network requests
function captureNetworkRequests(tabId) {
    chrome.debugger.attach({ tabId }, "1.3", () => {
        chrome.debugger.sendCommand({ tabId }, "Network.enable");
    });

    chrome.debugger.onEvent.addListener((source, method, params) => {
        if (method === "Network.requestWillBeSent") {
            networkLogs.push(params);
        }
    });
}

// Capture console logs
function captureConsoleLogs(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            window.consoleLogs = [];
            let originalLog = console.log;
            console.log = (...args) => {
                window.consoleLogs.push(args.join(" "));
                originalLog(...args);
            };
        }
    });
}

// Stop capturing logs and store them
function stopCapturingLogs() {
    storeFile("network_logs.json", JSON.stringify(networkLogs, null, 2));
    storeFile("console_logs.json", JSON.stringify(consoleLogs, null, 2));
}

function storeFile(name, data) {
    let blob;
    if (typeof data === "string") {
        blob = new Blob([data], { type: "application/json" });
    } else {
        blob = data;
    }
    filesToZip[name] = blob;
    console.log(`Stored ${name} with data ${data}`);
}
