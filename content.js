/*document.addEventListener('mouseup', () => {
  let selectedText = window.getSelection().toString().trim();
  if (selectedText) {
      console.log('Selected text:', selectedText);
      chrome.runtime.sendMessage({ text: selectedText }, function(response) {
          console.log('Response received in content.js:', response);
      });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "openExtensionWindow") {
      chrome.windows.create({
          url: chrome.runtime.getURL("popup.html"),
          type: "popup",
          width: 400,
          height: 600
      });
  }
});
*/

document.addEventListener('mouseup', () => {
  chrome.storage.sync.get(['enabled'], function(result) {
    if (result.enabled) {
      let selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        console.log('Selected text:', selectedText);
        chrome.runtime.sendMessage({ text: selectedText }, function(response) {
          console.log('Response received in content.js:', response);
        });
      }
    }
  });
});

