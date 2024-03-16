// controllers/chatGPTController.js
import ChatGPTModel from '../models/ChatGPTModel.js';
import { createError } from '../error.js';

class ChatGPTController {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async sendMessageToChatGPT(req, res) {
    const { message } = req.body;

    try {
      const chatGPTResponse = await ChatGPTModel.sendChatGPTMessage(message, this.apiKey);
      res.json({ success: true, message: chatGPTResponse });
    } catch (error) {
      const customError = createError(500, 'Error communicating with ChatGPT.');
      res.status(customError.status).json({ success: false, message: customError.message });
    }
  }
}

export default ChatGPTController;
