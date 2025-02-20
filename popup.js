console.log("Extension loaded");

document.addEventListener("DOMContentLoaded", () => {
  const recordButton = document.querySelector("#record");
  const exportButton = document.querySelector("#export");

  // Load the button state from storage
  chrome.storage.local.get(["isRecording"], (result) => {
    if (result.isRecording) {
      recordButton.textContent = "Stop Recording";
    } else {
      recordButton.textContent = "Start Recording";
    }
  });

  recordButton.addEventListener("click", async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (recordButton.textContent === "Start Recording") {
        // Start recording
        chrome.tabs.sendMessage(tabs[0].id, { action: "startRecording" });
        chrome.runtime.sendMessage({ action: "captureNetwork", tabId: tabs[0].id });

        // Start capturing network requests
        chrome.debugger.attach({ tabId: tabs[0].id }, '1.3', () => {
          chrome.debugger.sendCommand({ tabId: tabs[0].id }, 'Network.enable');
        });

        // Update button state
        recordButton.textContent = "Stop Recording";
        chrome.storage.local.set({ isRecording: true });
      } else {
        // Stop recording
        chrome.tabs.sendMessage(tabs[0].id, { action: "stopRecording" });

        // Stop capturing network requests
        chrome.debugger.detach({ tabId: tabs[0].id });
        chrome.runtime.sendMessage({ action: "stopCaptureNetwork", tabId: tabs[0].id });

        // Update button state
        recordButton.textContent = "Start Recording";
        chrome.storage.local.set({ isRecording: false });
      }
    });
  });

  exportButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "exportData" });
  });
});
