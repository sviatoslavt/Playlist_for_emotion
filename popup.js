document.addEventListener('DOMContentLoaded', function () {
    const CLIENT_ID = '301956762580-6kt6t1jjnnim9hq3vjpj3mdibj1jf56u.apps.googleusercontent.com';
    const toggleButton = document.getElementById('toggleButton');
    const resultDiv = document.getElementById('result');
    const historyContainer = document.getElementById('history');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userInfo = document.getElementById('userInfo');

    // Завантаження стану toggleButton
    chrome.storage.sync.get(['enabled'], function (result) {
        toggleButton.checked = result.enabled || false;
    });

    toggleButton.addEventListener('change', function () {
        chrome.storage.sync.set({ enabled: toggleButton.checked }, function () {
            console.log('Toggle state is set to ' + toggleButton.checked);
        });
    });

    // Перевірка авторизації при завантаженні
    chrome.storage.sync.get(['authToken', 'userData'], function (data) {
        if (data.authToken) {
            console.log('User is already authenticated');
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            renderUserInfo(data.userData);
            renderHistory();
        } else {
            console.log('User not authenticated');
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            historyContainer.innerHTML = `<p>You need to log in to view the history.</p>`;
        }
    });

    // Реєстрація/авторизація через Google
    loginButton.addEventListener('click', function () {
        console.log('Attempting authorization with Client ID:', CLIENT_ID);
        chrome.identity.launchWebAuthFlow({
            url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=https://${chrome.runtime.id}.chromiumapp.org/&scope=email profile`,
            interactive: true
        }, function (redirectUrl) {
            if (chrome.runtime.lastError) {
                console.error('Authorization failed:', chrome.runtime.lastError);
                return;
            }

            const params = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
            const token = params.get('access_token');

            if (token) {
                console.log('Authorization successful. Token:', token);
                chrome.storage.sync.set({ authToken: token }, function () {
                    console.log('Token saved');
                });

                fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log('User info:', data);
                        chrome.storage.sync.set({ userData: data }, function () {
                            console.log('User data saved');
                        });
                        renderUserInfo(data);
                        loginButton.style.display = 'none';
                        logoutButton.style.display = 'block';
                        renderHistory(); // Відобразити історію після авторизації
                    })
                    .catch((error) => console.error('Failed to fetch user info:', error));
            }
        });
    });

    // Вихід із системи
    logoutButton.addEventListener('click', function () {
        chrome.storage.sync.remove(['authToken', 'userData'], function () {
            console.log('User logged out');
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            userInfo.innerHTML = '';
            historyContainer.innerHTML = `<p>You need to log in to view the history.</p>`;
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
            `;

            // Записати історію незалежно від авторизації
            chrome.storage.sync.get(['history'], function (data) {
                const history = data.history || [];
                const currentTimestamp = new Date().toLocaleString();

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
                        chrome.storage.sync.get(['authToken'], function (authData) {
                            if (authData.authToken) {
                                renderHistory(); // Відобразити історію, якщо користувач авторизований
                            }
                        });
                    });
                }
            });
        } else {
            console.log('No valid emotion result found');
            resultDiv.innerHTML = `<p>No text selected or unable to analyze emotion.</p>`;
        }
    });

    // Функція для рендеру історії
    function renderHistory() {
        chrome.storage.sync.get(['history'], function (data) {
            const history = data.history || [];
            historyContainer.innerHTML = '';

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
        });
    }

    // Функція для відображення інформації про користувача
    function renderUserInfo(data) {
        userInfo.innerHTML = `
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
        `;
    }
});
