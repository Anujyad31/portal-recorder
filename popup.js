console.log("Extension loaded");
document.querySelector("#start").addEventListener("click", async () => {
    console.log("Start recording");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startRecording" });
    });
});

document.getElementById("stop").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "stopRecording" });
    });
});
