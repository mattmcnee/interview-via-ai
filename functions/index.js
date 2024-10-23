const functions = require('firebase-functions');
const cors = require('cors');
const OpenAI = require('openai'); // Make sure to import the OpenAI package correctly

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
