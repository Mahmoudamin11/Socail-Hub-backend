// Import necessary modules
import mongoose from "mongoose";
class ChatGPTModel {
  static async sendChatGPTMessage(message, apiKey) {
    const chatGPTController = new ChatGPTController(apiKey);
    return await chatGPTController.sendChatGPTMessage(message);
  }
}

export default ChatGPTModel;
