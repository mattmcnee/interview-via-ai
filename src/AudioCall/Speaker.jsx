import React, { useState, useEffect } from 'react';
import { useAudioCall } from './AudioCallContext';

const Speaker = () => {
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

  const { playSpeakerRef } = useAudioCall();

  useEffect(() => {
    playSpeakerRef.current = (transcript) => {

      // Clear previous state
      setError('');
      setAudioUrls([]);
      setCurrentAudioIndex(0);

      // Split input text into sentences
      const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript];
      const newAudioUrls = [];

      const fetchAudio = async () => {
        try {
          // Fetch audio for each sentence sequentially
          for (const sentence of sentences) {
            const response = await fetch(`${import.meta.env.VITE_TACOTRON_URL}/generate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ text: sentence.trim() })
            });

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            newAudioUrls.push(audioUrl);

            // Start playing the first audio as soon as it arrives
            if (newAudioUrls.length === 1) {
              setAudioUrls(newAudioUrls);
              setCurrentAudioIndex(0); // Start playback from the first audio
            }
          }

          // Set remaining audio URLs once all are fetched
          setAudioUrls(newAudioUrls);

        } catch (err) {
          setError(`Error: ${err.message}`);
        }
      };

      fetchAudio();
    };

    return () => {
      playSpeakerRef.current = null; // Clean up on unmount
    };
  }, [playSpeakerRef]);

  useEffect(() => {
    if (audioUrls.length > 0 && currentAudioIndex < audioUrls.length) {
      const audio = new Audio(audioUrls[currentAudioIndex]);

      // Play current audio and move to the next once it finishes
      audio.play();
      audio.onended = () => {
        setCurrentAudioIndex((prevIndex) => prevIndex + 1);
      };
    }
  }, [audioUrls, currentAudioIndex]);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Speaker;
