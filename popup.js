document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('toggleButton');
    const resultDiv = document.getElementById('result');
    const historyContainer = document.getElementById('history');

    // Завантаження стану toggleButton
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
                <div id="spotify-player">
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

            // Додати до історії, якщо це новий результат
            chrome.storage.sync.get(['history'], function (data) {
                const history = data.history || [];
                const currentTimestamp = new Date().toLocaleString();

                // Перевірка, чи є такий самий плейлист у списку
                const isDuplicate = history.some(
                    (entry) =>
                        entry.emotion === result.emotionResult.emotion &&
                        entry.playlist_name === result.emotionResult.playlist_name
                );

                if (!isDuplicate) {
                    history.push({
                        timestamp: currentTimestamp,
                        emotion: result.emotionResult.emotion,
                        playlist_name: result.emotionResult.playlist_name,
                        playlist_url: result.emotionResult.playlist_url,
                    });

                    chrome.storage.sync.set({ history: history }, function () {
                        console.log('History updated:', history);
                        renderHistory(history); // Оновити виведення історії
                    });
                } else {
                    renderHistory(history); // Просто оновити історію, якщо немає нових записів
                }
            });
        } else {
            console.log('No valid emotion result found');
            resultDiv.innerHTML = `<p>No text selected or unable to analyze emotion.</p>`;
        }
    });

    // Завантаження історії та відображення
    chrome.storage.sync.get(['history'], function (data) {
        const history = data.history || [];
        renderHistory(history);
    });

    // Функція для рендеру історії
    function renderHistory(history) {
        historyContainer.innerHTML = ''; // Очищення контейнера

        if (history.length === 0) {
            historyContainer.innerHTML = `<p>No history available.</p>`;
            return;
        }

        history.forEach((entry) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerHTML = `
                <p><strong>Date:</strong> ${entry.timestamp}</p>
                <p><strong>Emotion:</strong> ${entry.emotion}</p>
                <p><strong>Playlist:</strong> <a href="${entry.playlist_url}" target="_blank">${entry.playlist_name}</a></p>
                <hr>
            `;
            historyContainer.appendChild(historyItem);
        });
    }
});
