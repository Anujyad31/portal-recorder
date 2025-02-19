console.log("Extension loaded");

document.querySelector("#start").addEventListener("click", async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Start recording
    chrome.tabs.sendMessage(tabs[0].id, { action: "startRecording" });
    chrome.runtime.sendMessage({ action: "captureNetwork", tabId: tabs[0].id });

    // Start capturing network requests
    chrome.debugger.attach({ tabId: tabs[0].id }, '1.3', () => {
      chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Network.enable');
    });
  });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Stop recording
    chrome.tabs.sendMessage(tabs[0].id, { action: "stopRecording" });

    // Stop capturing network requests
    chrome.debugger.detach({ tabId: tabs[0].id });
    chrome.runtime.sendMessage({ action: "stopCaptureNetwork", tabId: tabs[0].id });
  });
});
