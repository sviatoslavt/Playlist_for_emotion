from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import AutoTokenizer, AutoModel
import torch.nn as nn
import torch.nn.functional as F
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

app = Flask(__name__)
CORS(app)  # Дозволити CORS для всіх маршрутів

# Нейронна мережа (BERT і додатковий згортковий шар)
class EmotionClassifierWithConv(nn.Module):
    def __init__(self, transformer_model, num_classes, kernel_size=3, num_filters=256):
        super(EmotionClassifierWithConv, self).__init__()
        self.transformer = transformer_model
        self.conv = nn.Conv1d(in_channels=768, out_channels=num_filters, kernel_size=kernel_size, padding=1)
        self.fc = nn.Linear(num_filters, num_classes)

    def forward(self, input_ids, attention_mask):
        output = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = output.last_hidden_state[:, 0, :]  # Використовуємо перший токен (CLS)
        pooled_output = pooled_output.unsqueeze(2)
        conv_out = F.relu(self.conv(pooled_output))
        pooled_conv_out, _ = torch.max(conv_out, dim=2)
        logits = self.fc(pooled_conv_out)
        return logits

model_path = "D:\\DIPLOM\\emotions_v4.pth"

# Завантаження токенізатора та моделі
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
transformer_model = AutoModel.from_pretrained("bert-base-uncased")

# Завантаження моделі з DataParallel
emotion_model = EmotionClassifierWithConv(transformer_model, num_classes=6)
emotion_model = nn.DataParallel(emotion_model)
emotion_model.load_state_dict(torch.load(model_path))
emotion_model.eval()

# Інтеграція з Spotify
client_id = 'd96d89b252d54cd28b7076a1c28563fc'
client_secret = '2f28e0e82aab4e35ad6221a953375f50'
client_credentials_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

emotion_dict = {
    0: "sadness (смуток 0)",
    1: "joy (задоволення 1)",
    2: "love (любов 2)",
    3: "anger (гнів 3)",
    4: "fear (страх 4)",
    5: "surprise (подив 5)"
}

def get_playlist_by_mood(mood):
    results = sp.search(q=f"mood:{mood} playlist", type='playlist')
    if results['playlists']['items']:
        playlist = results['playlists']['items'][0]
        playlist_name = playlist['name']
        playlist_url = playlist['external_urls']['spotify']
        playlist_image = playlist['images'][0]['url'] if playlist['images'] else None
        return playlist_name, playlist_url, playlist_image
    else:
        return None, None, None

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        text = data.get('text', '')

        # Токенізація тексту
        tokenized_text = tokenizer(text, truncation=True, padding=True, max_length=128, return_tensors='pt')
        input_ids = tokenized_text['input_ids']
        attention_mask = tokenized_text['attention_mask']

        # Передбачення емоції
        with torch.no_grad():
            outputs = emotion_model(input_ids, attention_mask)
            predicted_class = torch.argmax(outputs, dim=1).item()

        predicted_emotion = emotion_dict[predicted_class]
        playlist_name, playlist_url, playlist_image = get_playlist_by_mood(predicted_emotion)

        response = {
            'emotion': predicted_emotion,
            'playlist_name': playlist_name,
            'playlist_url': playlist_url,
            'playlist_image': playlist_image  # Додано поле зображення
        }

        return jsonify(response)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "An error occurred during prediction"}), 500

@app.route('/')
def home():
    return "Server is running"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
