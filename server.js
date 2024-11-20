const express = require('express');
const cors = require('cors'); // Імпорт CORS
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Налаштування CORS
app.use(cors()); // Додаємо CORS як middleware

// Підключення до бази даних MongoDB
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db, ratingsCollection;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('chromeExtensionData');
    ratingsCollection = db.collection('ratings');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}
connectDB();

// Middleware для роботи з JSON
app.use(express.json());

// Endpoint для отримання оцінок
app.get('/api/ratings', async (req, res) => {
  console.log('GET /api/ratings called');
  try {
    const ratings = await ratingsCollection.find().toArray();
    console.log('Ratings:', ratings);
    res.json(ratings);
  } catch (error) {
    console.error('Error retrieving ratings:', error);
    res.status(500).json({ message: 'Error retrieving ratings' });
  }
});

// Endpoint для відправки оцінки
app.post('/api/ratings', async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Invalid rating value. Must be between 1 and 5.' });
  }

  try {
    await ratingsCollection.insertOne({ rating, timestamp: new Date() });
    res.status(201).send('Rating saved');
  } catch (error) {
    console.error('Error saving rating:', error);
    res.status(500).json({ message: 'Error saving rating' });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Закриття з'єднання при завершенні процесу
process.on('SIGINT', async () => {
  await client.close();
  console.log('Disconnected from MongoDB');
  process.exit(0);
});
