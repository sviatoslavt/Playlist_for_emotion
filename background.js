chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message received in background.js:', request);
    fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: request.text })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);
        // Check if the response contains all necessary data
        if (data.emotion && data.playlist_name && data.playlist_url && data.playlist_image) {
            chrome.storage.sync.set({ 'emotionResult': data }, function() {
                console.log('Emotion result saved:', data);
                // Show notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/X_logo128.png',
                    title: 'Emotion Playlist',
                    message: 'Емоцію визначено, перейдіть у розширення для того, щоб дізнатись результат.'
                });
            });
        } else {
            console.error('Invalid data received from server:', data);
        }
        sendResponse(data);  // Also send the response back to the content script
    })
    .catch(error => {
        console.error('Error:', error);
        sendResponse({ error: 'Failed to fetch emotion and playlist' });
    });
    return true;  // Keep the messaging channel open for sendResponse
  });