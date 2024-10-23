const functions = require('firebase-functions');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const Pinecone = require('@pinecone-database/pinecone').Pinecone;

const pc = new Pinecone({
  apiKey: functions.config().pinecone.api_key
});

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

            const embedding = response.data.data[0].embedding;

            // Step 2: Send the embedding back to the client
            res.status(200).send({ embedding });
        } catch (error) {
            console.error('Error fetching embeddings from OpenAI:', error.response?.data || error.message);
            res.status(500).send('Error fetching embeddings from OpenAI');
        }
    });
});

exports.upsertEmbedding = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const items = req.body;
            
            if (!Array.isArray(items)) {
                throw new Error('Request body must be an array of items');
            }

            // Step 1: Prepare all texts for embedding
            const texts = items.map(item => `${item.title}\n${item.answer}`);

            // Step 2: Get embeddings for all texts in one request
            const response = await axios.post(
                'https://api.openai.com/v1/embeddings',
                {
                    input: texts,
                    model: 'text-embedding-3-small'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openaiApiKey}`
                    }
                }
            );

            // Step 3: Prepare vectors for Pinecone
            const vectors = response.data.data.map((embedding, index) => ({
                id: items[index].id,
                values: Array.from(embedding.embedding),
                metadata: {
                    title: items[index].title,
                    answer: items[index].answer
                }
            }));

            // Step 4: Initialize Pinecone index
            await pc.createIndex({
                name: 'interview-me',
                dimension: 1536,
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1',
                    },
                },
                suppressConflicts: true,
                waitUntilReady: true,
            });
            const index = pc.Index('interview-me');

            // Step 5: Upsert all vectors at once
            await index.upsert(vectors);

            res.status(200).send({ 
                message: 'Successfully processed embeddings',
                count: vectors.length 
            });

        } catch (error) {
            console.error('Error processing embeddings:', error.response?.data || error.message);
            res.status(500).send({
                error: 'Error processing embeddings',
                details: error.response?.data || error.message
            });
        }
    });
});

exports.getSimilarDocuments = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {

        // Step 1: Encode the text as a vector using OpenAI API

        const { topK, text } = req.body;
        const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
                input: text,
                model: 'text-embedding-3-small'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                }
            }
        );

        const vector = response.data.data[0].embedding;

        // Step 2: Query the Pinecone index for similar documents

        const index = pc.index('interview-me');
        const answer = await index.query({ topK: topK, vector: vector, includeMetadata: true });

        // const related = answer.matches.map(match => ({
        //     title: match.metadata.title,
        //     answer: match.metadata.answer
        // }));

        // Step 3: Obtain Retrieval Augmented Generation (RAG) response using OpenAI API

        const related = answer.matches.map(match => 
            `Question: ${match.metadata.title}\nAnswer: ${match.metadata.answer}`
        ).join('\n\n');

        const openai = new OpenAI({
            apiKey: openaiApiKey,
        });

        const ragResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are roleplaying as a candidate in a job interview and are tasked with answering questions. The provided context contains answers given by the candidate you are roleplaying as. Only use the information provided in the context to answer questions. You may say that you don't know or can't recall if no relevant context is available."
              },
              {
                role: "user",
                content: `Context:\n${related}\n\nQuestion: ${text}`
              }
            ],
            temperature: 0.3,
            max_tokens: 500
          });

        const ragMessage = ragResponse.choices[0].message.content;


  
        res.status(200).json({ success: true, message: ragMessage });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
});
