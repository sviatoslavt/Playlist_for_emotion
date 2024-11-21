document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('toggleButton');

    // Перевірка стану toggleButton
    chrome.storage.sync.get(['enabled'], function (result) {
        toggleButton.checked = result.enabled || false;
    });

    toggleButton.addEventListener('change', function () {
        chrome.storage.sync.set({ enabled: toggleButton.checked }, function () {
            console.log('Toggle state is set to ' + toggleButton.checked);
        });
    });

    // Відображення результату аналізу
    chrome.storage.sync.get(['emotionResult'], function (result) {
        console.log('Emotion result retrieved from storage:', result);
        const resultDiv = document.getElementById('result');
        const spotifyPlayerContainerId = 'spotify-player';

        if (
            result.emotionResult &&
            result.emotionResult.emotion &&
            result.emotionResult.playlist_name &&
            result.emotionResult.playlist_url &&
            result.emotionResult.playlist_image &&
            result.emotionResult.playlist_uri
        ) {
            resultDiv.innerHTML = `
                <p>Emotion: ${result.emotionResult.emotion}</p>
                <p>Playlist: <a href="${result.emotionResult.playlist_url}" target="_blank">${result.emotionResult.playlist_name}</a></p>
                <img src="${result.emotionResult.playlist_image}" alt="Playlist Image" style="width: 100px; height: 100px;">
                <div id="${spotifyPlayerContainerId}">
                    <h3>Spotify Player</h3>
                    <iframe
                        src="https://open.spotify.com/embed/playlist/${result.emotionResult.playlist_uri.split(':').pop()}"
                        width="300"
                        height="380"
                        frameborder="0"
                        allowtransparency="true"
                        allow="encrypted-media"
                    ></iframe>
                </div>
            `;
        } else {
            console.log('No valid emotion result found');
            resultDiv.innerHTML = `<p>No text selected or unable to analyze emotion.</p>`;
        }
    });
});
