import React, { useState, useEffect } from 'react';
import { useAudioCall } from './AudioCallContext';

const Speaker = () => {
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

  const { playSpeakerRef } = useAudioCall();

  useEffect(() => {
    playSpeakerRef.current = (transcript) => {
      setError('');
      setAudioUrls([]);
      setCurrentAudioIndex(0);

      // split input text into sentences by ".", "!", or "?"
      const sentences = transcript.match(/[^.!?]+[.!?]/g) || [transcript];
      const newAudioUrls = [];

      const fetchAudio = async (sentence) => {
        // create a fetch request promise for the API
        const fetchPromise = fetch(`${import.meta.env.VITE_TACOTRON_URL}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: sentence.trim() })
        });

        // create a 5 second timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout after 5 seconds')), 5000)
        );

        // use Promise.race to wait for either the fetch or the timeout
        return Promise.race([fetchPromise, timeoutPromise]);
      };

      const getAudioUrls = async () => {
        try {
          // fetch audio for each sentence sequentially
          for (const sentence of sentences) {
            const response = await fetchAudio(sentence);

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            newAudioUrls.push(audioUrl);

            // start playing the first audio as soon as it arrives
            if (newAudioUrls.length === 1) {
              setAudioUrls(newAudioUrls);
              setCurrentAudioIndex(0);
            }
          }

          // set remaining audio URLs once all are fetched
          setAudioUrls(newAudioUrls);

        } catch (err) {
          setError(`Error: ${err.message}`);
        }
      };

      getAudioUrls();
    };

    return () => {
      playSpeakerRef.current = null;
    };
  }, [playSpeakerRef]);

  useEffect(() => {
    if (audioUrls.length > 0 && currentAudioIndex < audioUrls.length) {
      const audio = new Audio(audioUrls[currentAudioIndex]);

      // play current audio and move to the next once it finishes
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
