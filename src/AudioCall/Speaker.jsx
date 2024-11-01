import React, { useState, useEffect, useRef } from 'react';
import { useAudioCall } from './AudioCallContext';

const Speaker = () => {
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const { playSpeakerRef } = useAudioCall();

  const playNextAudio = () => {
    if (currentAudioIndex < audioUrls.length && !isPlayingRef.current) {
      audioRef.current = new Audio(audioUrls[currentAudioIndex]);
      isPlayingRef.current = true;

      audioRef.current.play();

      audioRef.current.onended = () => {
        isPlayingRef.current = false;
        setCurrentAudioIndex((prevIndex) => prevIndex + 1);
      };
    }
  };

  useEffect(() => {
    playNextAudio();
  }, [audioUrls, currentAudioIndex]);

  useEffect(() => {
    playSpeakerRef.current = (transcript) => {
      setError('');
      setAudioUrls([]);
      setCurrentAudioIndex(0);
      isPlayingRef.current = false;

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
          for (const sentence of sentences) {
            const response = await fetchAudio(sentence);

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            newAudioUrls.push(audioUrl);

            // Update audioUrls immediately after each file is fetched
            setAudioUrls([...newAudioUrls]);
          }
        } catch (err) {
          setError(`Error: ${err.message}`);
        }
      };

      getAudioUrls();
    };

    return () => {
      playSpeakerRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [playSpeakerRef]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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