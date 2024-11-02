const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const Pinecone = require('@pinecone-database/pinecone').Pinecone;
const { SpeechClient } = require('@google-cloud/speech');
const { Buffer } = require('buffer');
const { InstancesClient } = require('@google-cloud/compute').v1;

admin.initializeApp();
const db = admin.firestore();

const pc = new Pinecone({
  apiKey: functions.config().pinecone.api_key
});

const openaiApiKey = functions.config().openai.api_key;

// currently allowing requests from all origins
const corsHandler = cors({
    origin: true,
});

exports.startVM = functions.runWith({ secrets: ["VM_SERVICE_ACCOUNT"] }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // Manually instantiate the Compute client with service account credentials
            const serviceAccount = JSON.parse(Buffer.from(process.env.VM_SERVICE_ACCOUNT, 'base64').toString());
            const computeClient = new InstancesClient({
                credentials: serviceAccount,
            });

            // Configuration variables
            const projectId = functions.config().vm.project;
            const zone = functions.config().vm.zone;
            const instanceName = functions.config().vm.id;

            // Get the VM instance
            const [metadata] = await computeClient.get({
                project: projectId,
                zone: zone,
                instance: instanceName,
            });
            const status = metadata.status;

            // Only start if the VM is stopped
            if (status === 'TERMINATED') {
                const [operation] = await computeClient.start({
                    project: projectId,
                    zone: zone,
                    instance: instanceName,
                });

                res.json({
                    success: true,
                    message: `VM ${instanceName} is starting up`,
                    status: 'STARTING'
                });
            } else {
                res.json({
                    success: true,
                    message: `VM ${instanceName} is already running`,
                    status: status
                });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

exports.checkVM = functions.runWith({ secrets: ["VM_SERVICE_ACCOUNT"] }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // Manually instantiate the Compute client with service account credentials
            const serviceAccount = JSON.parse(Buffer.from(process.env.VM_SERVICE_ACCOUNT, 'base64').toString());
            const computeClient = new InstancesClient({
                credentials: serviceAccount,
            });

            // Configuration variables
            const projectId = functions.config().vm.project;
            const zone = functions.config().vm.zone;
            const instanceName = functions.config().vm.id;

            // Get the VM instance
            const [metadata] = await computeClient.get({
                project: projectId,
                zone: zone,
                instance: instanceName,
            });
            const status = metadata.status;

            // Respond with the current status of the VM
            res.json({
                success: true,
                message: `VM ${instanceName} status checked successfully`,
                status: status
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

exports.getEmbedding = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { inputText } = req.body;

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

        const { topK, text, preprompt } = req.body;
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
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: preprompt
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

exports.getTextFromAudioBatch = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const base64Key = functions.config().speech_to_text.service_account_key;
            const jsonKey = Buffer.from(base64Key, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(jsonKey);

            // Instantiate the Speech Client
            const client = new SpeechClient({ credentials: serviceAccount });

            // Expecting the audio file path and configurations from the request body
            const { filename, encoding, sampleRateHertz, languageCode, fileaudio } = req.body;

            const config = {
                enableWordTimeOffsets: true,
                enableAutomaticPunctuation: false,
                encoding: encoding,
                sampleRateHertz: sampleRateHertz,
                languageCode: languageCode,
            };

            const audio = {
                content: fileaudio,
            };

            const request = {
                config: config,
                audio: audio,
            };

            // Detects speech in the audio file
            const [response] = await client.recognize(request);
            const transcriptions = [];

            response.results.forEach(result => {
                const transcription = {
                    text: result.alternatives[0].transcript,
                    words: []
                };

                result.alternatives[0].words.forEach(wordInfo => {
                    const startSecs =
                        `${wordInfo.startTime.seconds}` +
                        '.' +
                        (wordInfo.startTime.nanos / 100000000);
                    const endSecs =
                        `${wordInfo.endTime.seconds}` +
                        '.' +
                        (wordInfo.endTime.nanos / 100000000);

                    transcription.words.push({
                        word: wordInfo.word,
                        start: startSecs,
                        end: endSecs
                    });
                });

                transcriptions.push(transcription);
            });

            res.status(200).send(transcriptions);
        } catch (error) {
            console.error('Error during transcription:', error);
            res.status(500).send('Error during transcription: ' + error.message);
        }
    });
});

