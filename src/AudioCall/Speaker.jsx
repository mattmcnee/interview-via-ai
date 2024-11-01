import React, { useState, useEffect, useRef } from 'react';
import { useAudioCall } from './AudioCallContext';

const Speaker = () => {
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null); // Ref to manage the audio playback state
  const { playSpeakerRef } = useAudioCall();

  useEffect(() => {
    playSpeakerRef.current = (transcript) => {
      setError('');
      setAudioUrls([]);
      setCurrentAudioIndex(0);

      // Split input text into sentences by ".", "!", or "?"
      const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript];
      const newAudioUrls = [];

      const fetchAudio = async (sentence) => {
        const fetchPromise = fetch(`${import.meta.env.VITE_TACOTRON_URL}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: sentence.trim() })
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout after 5 seconds')), 5000)
        );

        return Promise.race([fetchPromise, timeoutPromise]);
      };

      const getAudioUrls = async () => {
        try {
          // Fetch audio for each sentence sequentially
          for (const sentence of sentences) {
            const response = await fetchAudio(sentence);

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            newAudioUrls.push(audioUrl);
          }

          // Set audio URLs for playback
          setAudioUrls(newAudioUrls);

        } catch (err) {
          setError(`Error: ${err.message}`);
        }
      };

      getAudioUrls();
    };

    return () => {
      playSpeakerRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause(); // Stop audio if component unmounts
        audioRef.current.src = ''; // Clean up the audio source
      }
    };
  }, [playSpeakerRef]);

  useEffect(() => {
    if (audioUrls.length > 0 && currentAudioIndex < audioUrls.length) {
      audioRef.current = new Audio(audioUrls[currentAudioIndex]);

      // Play current audio
      audioRef.current.play();

      // When the current audio ends, move to the next one
      audioRef.current.onended = () => {
        setCurrentAudioIndex((prevIndex) => prevIndex + 1);
      };
    }
  }, [audioUrls, currentAudioIndex]);

  // Handle cleanup of the audio object on unmount or index change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ''; // Clean up the audio source
      }
    };
  }, []);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Speaker;
