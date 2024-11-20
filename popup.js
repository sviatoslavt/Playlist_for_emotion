document.addEventListener('DOMContentLoaded', function() {
  var toggleButton = document.getElementById('toggleButton');

  chrome.storage.sync.get(['enabled'], function(result) {
      toggleButton.checked = result.enabled || false;
  });

  toggleButton.addEventListener('change', function() {
      chrome.storage.sync.set({ 'enabled': toggleButton.checked }, function() {
          console.log('Toggle state is set to ' + toggleButton.checked);
      });
  });

  // Display the analysis result if available
  chrome.storage.sync.get(['emotionResult'], function(result) {
      console.log('Emotion result retrieved from storage:', result);
      let resultDiv = document.getElementById('result');
      if (result.emotionResult && result.emotionResult.emotion && result.emotionResult.playlist_name && result.emotionResult.playlist_url && result.emotionResult.playlist_image) {
          console.log('Updating resultDiv with emotion result');
          resultDiv.innerHTML = `
              <p>Emotion: ${result.emotionResult.emotion}</p>
              <p>Playlist: <a href="${result.emotionResult.playlist_url}" target="_blank">${result.emotionResult.playlist_name}</a></p>
              <img src="${result.emotionResult.playlist_image}" alt="Playlist Image" style="width: 100px; height: 100px;">
         ` ;
      } else {
          console.log('No valid emotion result found');
          resultDiv.innerHTML = `<p>No text selected or unable to analyze emotion.</p>`;
      }
  });
});