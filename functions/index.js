const functions = require('firebase-functions');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');

const openaiApiKey = functions.config().openai.api_key;

// Initialize CORS middleware
const corsHandler = cors({ origin: true });

exports.textCompletionOpenAi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { prompt } = req.body; // Assume you're sending a prompt in the request body

            // Initialize OpenAI client with the API key
            const openai = new OpenAI({
                apiKey: openaiApiKey, // Use the API key from Firebase config
            });

            // Create a completion using the OpenAI API
            const completion = await openai.chat.completions.create({
                model: "gpt-4", // Use the correct model name
                messages: [
                    { "role": "user", "content": prompt } // Use the prompt from the request
                ]
            });

            // Send the response back to the client
            res.status(200).send(completion);
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            res.status(500).send('Error calling OpenAI API');
        }
    });
});


exports.getEmbedding = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { inputText } = req.body; // Assume you're sending the text in the request body

            // Step 1: Make a POST request to OpenAI embeddings endpoint
            const response = await axios.post(
                'https://api.openai.com/v1/embeddings',
                {
                    input: inputText, // Input text to embed
                    model: 'text-embedding-3-small' // Replace with the desired model
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openaiApiKey}` // API key from Firebase config
                    }
                }
            );

            const embedding = response.data;

            // Step 2: Send the embedding back to the client
            res.status(200).send({ embedding });
        } catch (error) {
            console.error('Error fetching embeddings from OpenAI:', error.response?.data || error.message);
            res.status(500).send('Error fetching embeddings from OpenAI');
        }
    });
});
