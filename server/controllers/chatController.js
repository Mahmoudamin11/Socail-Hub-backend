// server/controllers/chatController.js
import axios from 'axios';
import dotenv from 'dotenv';
import Chat from '../models/Chat.js';

dotenv.config();

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const API_URL = "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2";

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const createChat = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        console.log("Sending Request to Hugging Face API");
        let response;
        let retries = 5;  // Number of retries
        let retryDelay = 5000;  // Initial delay between retries in milliseconds

        const refinedPrompt = {
            inputs: {
                question: message,
                context: "Paris is the capital of France. The capital of Egypt is Cairo. The capital of Japan is Tokyo." // Provide a context
            }
        };

        for (let i = 0; i < retries; i++) {
            try {
                response = await axios.post(
                    API_URL,
                    refinedPrompt,
                    {
                        headers: {
                            Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                    }
                );

                // Check for loading state
                if (response.data.error && response.data.error.includes('is currently loading')) {
                    const estimatedTime = response.data.estimated_time ? response.data.estimated_time * 1000 : retryDelay;
                    console.log(`Model is loading. Retrying in ${estimatedTime / 1000} seconds...`);
                    await delay(estimatedTime);
                } else {
                    break;
                }
            } catch (err) {
                if (err.response && err.response.status === 503 && i < retries - 1) {
                    console.log(`Service unavailable. Retrying in ${retryDelay / 1000} seconds...`);
                    await delay(retryDelay);
                } else {
                    throw err;
                }
            }
        }

        if (!response || response.data.error) {
            throw new Error('Failed to generate response from the model.');
        }

        console.log("Received Response from Hugging Face API");
        console.log("Response Data:", response.data);

        let botResponse = response.data.answer;

        if (!botResponse || botResponse.trim() === '') {
            throw new Error('Failed to generate a meaningful response from the model.');
        }

        botResponse = botResponse.trim();

        // Save the chat to the database
        const chat = new Chat({
            userMessage: message,
            botResponse: botResponse,
        });
        await chat.save();

        // Ensure the response is returned in JSON format
        res.json({ userMessage: message, botResponse: botResponse });

    } catch (error) {
        console.error("Error Response:", error.response?.data || error.message);
        if (error.response && error.response.status === 429) {
            return res.status(429).json({
                error: 'You have exceeded your current quota. Please check your plan and billing details.',
            });
        } else if (error.response && error.response.status === 400) {
            return res.status(400).json({
                error: 'Bad request. Please check the API key and request data.',
            });
        } else if (error.response && error.response.status === 503) {
            return res.status(503).json({
                error: 'Service unavailable. Please try again later.',
            });
        } else {
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
};

export { createChat };
