import axios from 'axios';
import dotenv from 'dotenv';
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN, // قم بتحميل المفتاح من ملف .env
});

export const createChat = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const input = {
            prompt: prompt, // النص الذي تريد إرساله للنموذج
            max_new_tokens: 512,
            prompt_template:
                "<|begin_of_text|><|start_header|>system<|end_header|>\n\n{system_prompt}<|eot|><|start_header|>user<|end_header|>\n\n{prompt}<|eot|><|start_header|>assistant<|end_header|>\n\n",
        };

        const output = await replicate.run(
            "meta/meta-llama-3-8b-instruct", // اسم النموذج
            {
                input,
            }
        );

        res.json({ input: prompt, output });
    } catch (error) {
        console.error("Error running model:", error);
        res.status(500).json({ error: "Error running model" });
    }
};
