const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');
const Pinecone = require('@pinecone-database/pinecone').Pinecone;
const { SpeechClient } = require('@google-cloud/speech');
const { Buffer } = require('buffer');
const { InstancesClient } = require('@google-cloud/compute').v1;
const crypto = require('crypto');
require('dotenv').config();

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

const authenticateRequest = (req, apiKey, method) => {
    let payloadString;
    
    if (method === 'GET') {
        // sort the query parameters to ensure consistent ordering
        const orderedParams = {};
        Object.keys(req.query).sort().forEach(key => {
            orderedParams[key] = req.query[key];
        });
        payloadString = JSON.stringify(orderedParams);
    } else if (method === 'POST') {
        payloadString = JSON.stringify(req.body);
    } else {
        throw new Error('Invalid method. Must be either "GET" or "POST"');
    }

    console.log('Payload:', payloadString);

    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');
    
    const signature = req.headers['x-signature'];
    return signature === expectedSignature;
};

exports.startVM = functions.runWith({ secrets: ["VM_SERVICE_ACCOUNT"] }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'POST';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });


            // manually instantiate the Compute client with service account credentials
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
                    status: 'STARTING',
                    externalIp: 'blank'
                });
            } else {
                const networkInterfaces = metadata.networkInterfaces || [];
                const externalIp = networkInterfaces.length > 0 && networkInterfaces[0].accessConfigs
                    ? networkInterfaces[0].accessConfigs[0].natIP
                    : "blank";

                res.json({
                    success: true,
                    message: `VM ${instanceName} is already running`,
                    status: status,
                    externalIp: externalIp
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

exports.stopVM = functions.runWith({ secrets: ["VM_SERVICE_ACCOUNT"] }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'POST';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });

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

            // Only stop if the VM is running
            if (status === 'RUNNING') {
                const [operation] = await computeClient.stop({
                    project: projectId,
                    zone: zone,
                    instance: instanceName,
                });

                res.json({
                    success: true,
                    message: `VM ${instanceName} is stopping`,
                    status: 'STOPPING',
                    externalIp: 'blank'
                });
            } else {
                const networkInterfaces = metadata.networkInterfaces || [];
                const externalIp = networkInterfaces.length > 0 && networkInterfaces[0].accessConfigs
                    ? networkInterfaces[0].accessConfigs[0].natIP
                    : "blank";

                res.json({
                    success: true,
                    message: `VM ${instanceName} is already stopped`,
                    status: status,
                    externalIp: externalIp
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


exports.getVMStatus = functions.runWith({ secrets: ["VM_SERVICE_ACCOUNT"] }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'GET';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });


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

            const networkInterfaces = metadata.networkInterfaces || [];
            const externalIp = networkInterfaces.length > 0 && networkInterfaces[0].accessConfigs
                ? networkInterfaces[0].accessConfigs[0].natIP
                : "blank";

            // Respond with the current status of the VM
            res.json({
                success: true,
                message: `VM ${instanceName} status checked successfully`,
                status: status,
                externalIp: externalIp
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

exports.awaitVMStatus = functions.runWith({ secrets: ["VM_SERVICE_ACCOUNT"] }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'GET';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });


            const timeout = parseInt(req.query.timeout) || 30000; // Default 30s timeout
            const targetStatus = req.query.target;
            
            if (!targetStatus) {
                throw new Error("Target status must be specified");
            }

            // Manually instantiate the Compute client with service account credentials
            const serviceAccount = JSON.parse(Buffer.from(process.env.VM_SERVICE_ACCOUNT, 'base64').toString());
            const computeClient = new InstancesClient({
                credentials: serviceAccount,
            });

            // Configuration variables
            const projectId = functions.config().vm.project;
            const zone = functions.config().vm.zone;
            const instanceName = functions.config().vm.id;

            const startTime = Date.now();
            let currentStatus = null;
            let currentExternalIp = "blank";

            // Poll every 200ms until timeout or target status is reached
            while (Date.now() - startTime < timeout) {
                const [metadata] = await computeClient.get({
                    project: projectId,
                    zone: zone,
                    instance: instanceName,
                });

                currentStatus = metadata.status;
                
                const networkInterfaces = metadata.networkInterfaces || [];
                currentExternalIp = networkInterfaces.length > 0 && networkInterfaces[0].accessConfigs
                    ? networkInterfaces[0].accessConfigs[0].natIP
                    : "blank";

                if (currentStatus === targetStatus) {
                    return res.json({
                        success: true,
                        message: `VM ${instanceName} reached target status: ${targetStatus}`,
                        status: currentStatus,
                        externalIp: currentExternalIp
                    });
                }

                // Wait 200ms before next check
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // If we get here, we've timed out
            res.json({
                success: false,
                message: `Timeout reached before VM ${instanceName} reached status: ${targetStatus}`,
                status: currentStatus,
                externalIp: currentExternalIp,
                timeoutReached: true
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

exports.awaitFlaskStatus = functions.runWith({ secrets: ["VM_SERVICE_ACCOUNT"] }).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const orderedParams = {};
            Object.keys(req.query).sort().forEach(key => {
                orderedParams[key] = req.query[key];
            });
            payloadString = JSON.stringify(orderedParams);
            console.log('Payload:', payloadString);




            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'GET';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });

            const timeout = parseInt(req.query.timeout) || 30000; // Default 30s timeout
            const apiPath = req.query.apiPath;
            
            if (!apiPath) {
                throw new Error("API path must be specified");
            }

            const startTime = Date.now();
            let currentStatus = false;
            let lastError = null;
            let attempts = 0;

            // Poll every 200ms until timeout or healthy status is reached
            while (Date.now() - startTime < timeout) {
                attempts++;
                try {
                    const response = await axios.get(`${apiPath}/health`, {
                        timeout: 200 // 200ms timeout for each individual request
                    });
                    
                    currentStatus = response.data?.status === 'ACTIVE';
                    
                    if (currentStatus) {
                        return res.json({
                            success: true,
                            message: 'Flask API is healthy',
                            status: 'ACTIVE',
                            attempts: attempts,
                            elapsedTime: Date.now() - startTime
                        });
                    }
                } catch (error) {
                    // Store the error message, but only if it's not a common connection issue
                    if (error.message && 
                        !error.message.includes("ERR_CONNECTION_REFUSED") && 
                        !error.message.includes("ERR_NETWORK") &&
                        !error.message.includes("ECONNREFUSED") &&
                        !error.message.includes("connect ETIMEDOUT")) {
                        console.error('API check failed:', error);
                        lastError = error.message;
                    }
                    
                    currentStatus = false;
                }

                // Wait 200ms before next check
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // If we get here, we've timed out
            res.json({
                success: false,
                message: 'Timeout reached waiting for Flask API to become healthy',
                status: 'INACTIVE',
                attempts: attempts,
                elapsedTime: Date.now() - startTime,
                timeoutReached: true,
                lastError: lastError
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
            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'POST';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });

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
            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'POST';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });

            const items = req.body.data;
            
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

exports.getSimilarDocuments = functions.runWith({ memory: "512MB" }).https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        // early returns if wrong method or invalid signature
        const VALID_METHOD = 'POST';
        const apiKey = process.env.FUNCTIONS_API_KEY;
        if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
        if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });


        // Step 1: Encode the text as a vector using OpenAI API

        const { topK, text, preprompt, history } = req.body;
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

        const related = answer.matches
        .filter(match => match.score >= 0.25) // less than 0.25 is unlikely to be relevant
        .map(match => 
            `Question: ${match.metadata.title}\nAnswer: ${match.metadata.answer}`
        )
        .join('\n\n');


        // Step 3: Obtain Retrieval Augmented Generation (RAG) response using OpenAI API

        const openai = new OpenAI({
            apiKey: openaiApiKey,
        });

        var messages = [...history];

        // if there is at least one related document
        if (related.length > 0) {
            const promptIndex = messages.length - 1;
        
            // if there is at least one item in messages
            if (promptIndex >= 0) {
                // add retrieved context to prompt
                const prompt = messages[promptIndex].content;
                messages[promptIndex] = {
                    role: "user",
                    content: `${prompt}\n\nThis is potential context. IGNORE THIS IF IT IS NOT RELEVANT:\n\n${related}`
                };
            }
        }

        // Now make the API call with the modified history
        const ragResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.3,
            max_tokens: 500
        });


        const ragMessage = ragResponse.choices[0].message.content;


  
        res.status(200).json({ success: true, message: ragMessage, context: answer });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
});

exports.getTextFromAudioBatch = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            // early returns if wrong method or invalid signature
            const VALID_METHOD = 'POST';
            const apiKey = process.env.FUNCTIONS_API_KEY;
            if (req.method !== VALID_METHOD) return res.status(405).json({ error: `Method not allowed. Allowed methods: ${VALID_METHOD}` });
            if (!authenticateRequest(req, apiKey, VALID_METHOD)) return res.status(401).json({ error: 'Invalid signature' });

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

exports.generateAudio = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { text, path } = req.body;
  
        // Validate required fields
        if (!text || !path) {
          return res.status(400).json({ error: 'No text or path provided' });
        }
  
        // Set up fetch and timeout promises
        const fetchPromise = fetch(`${path}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
  
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout after 3 seconds')), 3000)
        );
  
        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);
  
        // Check if response is OK and is of type audio/wav
        if (!response.ok || !response.headers.get('content-type').includes('audio/wav')) {
          return res.status(response.status).json({ error: 'Failed to generate audio or unexpected response format.' });
        }
  
        // Handle binary audio response
        const audioBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'audio/wav');
        return res.status(200).send(Buffer.from(audioBuffer));
  
      } catch (error) {
        console.error('Error generating audio:', error);
        return res.status(500).json({ error: 'An error occurred while generating audio.' });
      }
    });
  });
  
  
  


