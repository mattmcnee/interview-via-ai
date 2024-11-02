import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAudioCall } from './AudioCallContext';
import Display from './Display';

const Listener = () => {
    const { setUserTranscript, setUserCurrentMessage, combinedTranscript, pushUserMessage } = useAudioCall();

    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunksRef = useRef([]);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const orderedResponses = useRef([]);
    const [wordsArray, setWordsArray] = useState([]);
    const [lastEmptyResponse, setLastEmptyResponse] = useState(0);

    const TIMESLICE = 3000;
    const PAUSE_THRESHOLD = 1.4;

    // detect tab visibility to stop recording if tab is inactive
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isRecording) {
                handleStopRecording();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // cleanup function to stop media recorder if it exists
            if (mediaRecorder) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                mediaRecorder.stop();
            }
        };
    }, [mediaRecorder, isRecording]);

    const handleStartRecording = async () => {
        // don't start recording if the tab is not visible
        if (document.hidden) {
            setError("Cannot start recording while tab is inactive");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { timeslice: TIMESLICE }); // 3 seconds chunks
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            recorder.onstop = handleTimesliceRecording;

            audioChunksRef.current = [];
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            console.log("Recording started");

            // set up an interval to restart recording automatically
            intervalRef.current = setInterval(() => {
                recorder.stop();
                recorder.start();
            }, TIMESLICE);

        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Failed to access microphone.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            console.log("Recording stopped");
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            sendCurrentAudio();

            // Stop all tracks in the stream
            mediaRecorder.stream.getTracks().forEach(track => track.stop());

            // reset mediaRecorder to null to allow new recording and clear audio chunks
            setMediaRecorder(null);
            audioChunksRef.current = [];
        }
    };

    // Rest of the code remains the same...
    const handleTimesliceRecording = async () => {
        if (audioChunksRef.current.length > 0) {            
            await sendCurrentAudio();
        } else {
            console.error("No audio chunks available.");
            setError("No audio was recorded. Please try again.");
        }
    };

    const sendCurrentAudio = async () => {
        if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);

            await sendAudio(audioBlob, decodedAudio.sampleRate);
            audioChunksRef.current = []; 
        }
    };

    const sendAudio = async (audioBlob, sampleRate = 22050) => {
        const reader = new FileReader();
        const timestamp = new Date().toISOString(); // unique timestamp for ordering

        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];

            try {
                const result = await axios.post(`${import.meta.env.VITE_API_URL}/getTextFromAudioBatch`, {
                    filename: 'recording.webm',
                    encoding: 'OPUS',
                    sampleRateHertz: sampleRate,
                    languageCode: 'en-US',
                    fileaudio: base64Audio,
                });

                const response = {
                    text: result?.data[0]?.text,
                    words: result?.data[0]?.words,
                    timestamp: timestamp,
                };

                addOrderedResponse(response);
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        };

        reader.readAsDataURL(audioBlob);
    };

    const addOrderedResponse = (newResponse) => {
        orderedResponses.current = [...orderedResponses.current, newResponse].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        const updatedResponses = orderedResponses.current;
        const allWordsWithPauses = [];

        updatedResponses.forEach((response) => {
            const responseTimestamp = new Date(response.timestamp).getTime() / 1000;

            if (!response.words) {
                setLastEmptyResponse(responseTimestamp + TIMESLICE/1000);
                return;
            }

            response.words.forEach((word) => {
                const updatedWord = {
                    word: word.word,
                    start: parseFloat(word.start) + responseTimestamp,
                    end: parseFloat(word.end) + responseTimestamp,
                };
                allWordsWithPauses.push(updatedWord);
            });
        });

        setWordsArray(allWordsWithPauses);
    };

    const userSentences = useRef([]);

    const addSentenceIfUnique = (sentence, time) => {
        console.log("Time:", time);
        if (sentence && !userSentences.current.includes(sentence)) {
            userSentences.current.push(sentence);
            pushUserMessage({sentence, time: time + 1});
        }
    };

    const capitalizeAndTrim = (str) => 
        str ? str.trim().charAt(0).toUpperCase() + str.trim().slice(1) : str;

    useEffect(() => {
        let resultString = '';
        let transcript = [];
        let transcriptString = '';
        wordsArray.forEach((wordObj, index) => {
            const endTime = wordObj.end;
            const nextWordObj = wordsArray[index + 1];
    
            resultString += wordObj.word + ' ';
            transcriptString += wordObj.word + ' ';
    
            if (nextWordObj) {
                const gap = nextWordObj.start - endTime;
                if (gap > 1.4) {
                    addSentenceIfUnique(resultString.trim(), endTime);
                    transcript.push({text:transcriptString.trim(), time: endTime, role: "user"});

                    resultString = "";
                    transcriptString = "";
                }
            }
        });
    
        resultString = resultString.trim();
        
        if (wordsArray.length > 0) {
            const lastWordEndTime = wordsArray[wordsArray.length - 1].end;
            if (lastEmptyResponse - lastWordEndTime > 1.4) {
                addSentenceIfUnique(resultString, lastWordEndTime);
            }
            transcript.push({text:capitalizeAndTrim(transcriptString), time: lastWordEndTime, role: "user"});
        }

        setUserTranscript(transcript);
    }, [wordsArray, lastEmptyResponse]);

    return (
        <div>
            <Display
                isRecording={isRecording}
                handleStartRecording={handleStartRecording}
                handleStopRecording={handleStopRecording}
                combinedTranscript={combinedTranscript}
                error={error}
            />
        </div>
    );
};

export default Listener;