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
                const arrayBuffer = await blob.arrayBuffer();
                const base64String = arrayBufferToBase64(arrayBuffer);
                chrome.storage.local.set({ recordingBlob: base64String });
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
    }
});

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
