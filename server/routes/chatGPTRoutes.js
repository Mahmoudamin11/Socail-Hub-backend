// Import necessary modules
import express from 'express';
import ChatGPTModel from '../models/ChatGPTModel.js';

const router = express.Router();

router.post('send-message', async (req, res) => {
  const { message } = req.body;
  const apiKey = process.env.OPENAI_API_KEY; // Load your API key from environment variables

  try {
    const chatGPTResponse = await ChatGPTModel.sendChatGPTMessage(message, apiKey);
    res.json({ success: true, message: chatGPTResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error communicating with ChatGPT.' });
  }
});

export default router;
