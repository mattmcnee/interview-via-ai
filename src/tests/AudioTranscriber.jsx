import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const AudioTranscriber = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    // Initialize the WebSocket connection
    socketRef.current = io(import.meta.env.VITE_CPU_URL);

    // Listen for transcript messages from the server
    socketRef.current.on('transcript', (data) => {
      setTranscript((prev) => prev + ' ' + data.transcript);
    });

    return () => {
      // Clean up the connection when the component unmounts
      socketRef.current.disconnect();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Log the sample rate
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('Sample rate:', audioTracks[0].getSettings().sampleRate);
      }
  
      mediaRecorderRef.current.start();
  
      // Store the recorded audio data
      const audioChunks = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onstop = async () => {
        // When recording stops, send all audio data at once
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const sampleRate = mediaRecorderRef.current?.stream.getAudioTracks()[0].getSettings().sampleRate;
      
        const payload = {
          audio: new Uint8Array(arrayBuffer),
          sampleRate: sampleRate,
          encoding: 'PCM',
        };
      
        // Send the audio data and metadata to the server
        socketRef.current.emit('audio', payload);
        socketRef.current.emit('stop'); // Notify the server to process the audio
      };
      
  
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };
  

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // This triggers the onstop event
      setIsRecording(false);
    }
  };

  return (
    <div>
      <h1>Real-Time Speech to Text</h1>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <div id="transcript">{transcript}</div>
    </div>
  );
};

export default AudioTranscriber;
