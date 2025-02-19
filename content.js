let mediaRecorder;
let chunks = [];

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "startRecording") {
        console.log("Starting recording");
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            console.error("Screen recording is not supported");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: "tab" },
                audio: false,
                preferCurrentTab: true,
            });

            mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            chunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                console.log("Recording stopped");
                const blob = new Blob(chunks, { type: "video/webm" });
                storeFile("recording.webm", blob);
            };

            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 5 * 60 * 1000); // Force stop after 5 mins 
        } catch (error) {
            console.error("Error accessing screen:", error);
        }
    } else if (request.action === "stopRecording") {
        console.log("Stopping recording");
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        const networkRequests = await chrome.storage.local.get(["networkRequests"])
        const blob = new Blob([JSON.stringify(networkRequests.networkRequests, null, 2)], { type: "application/json" });
        storeFile("network_requests.json", blob);
    }
});

// Function to store the file
function storeFile(name, data) {
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
}
