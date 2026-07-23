import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("WARNING: API_KEY environment variable is not defined!");
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CleanMicroservice' });
});

app.listen(PORT, () => {
  console.log(`Server running safely on port ${PORT}`);
});
