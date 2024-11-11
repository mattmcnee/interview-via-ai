# Interview Via AI

This repository contains all the required code to build a speech to speech AI agent with retrieval augmented generation and speech generation with a Tacotron 2 voice clone. The frontend is React and Vite, and hosting is done through Google Cloud Platform (Firebase Functions + a VM Instance).

Pinecone's vector database with cosine similarity is used for retrieval augmented generation. OpenAI's text-embedding-3-small model is used to get vectors from text. Similar documents are included in the prompt to gpt-4o-mini.

## React + Vite Frontend

Available in the [src](https://github.com/mattmcnee/interview-via-ai/tree/main/src) folder, this contains the UI and handles all the data to simulate a live call.

## Firebase Functions

Available in the [functions](https://github.com/mattmcnee/interview-via-ai/tree/main/functions) folder, this handles required requests to Pinecone, OpenAI and the VM Instance.

## VM Text-to-speech

Available in the [api](https://github.com/mattmcnee/interview-via-ai/tree/main/api) folder, this hosts a Tacotron 2 model on a GPU VM instance running a Flask server.

## Tacotron 2 Training

Available in the [tts_training](https://github.com/mattmcnee/interview-via-ai/tree/main/tts_training) folder, this jupyter notebook provides the start to finish code to train a Tacotron 2 model.





