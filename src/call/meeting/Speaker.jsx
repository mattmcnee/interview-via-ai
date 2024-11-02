import React, { useState, useEffect, useRef } from 'react';
import { useAudioCall } from './AudioCallContext';

const Speaker = () => {
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const { playSpeakerRef, setAiTranscript, ttsApiPath } = useAudioCall();

  const cleanText = (text) => text.replace(/["“”‘’]/g, '').trimEnd();

  // Process text for TTS
  const processTextForTTS = (text) => {
    return text.split(' ').map(word => {
      const trimmedWord = word.replace(/[.,!?;]$/, '');
      const punctuation = word.slice(trimmedWord.length);

      if (/^[A-Z]+s?$/.test(trimmedWord)) {
        const lastChar = trimmedWord.charAt(trimmedWord.length - 1) === 's' ? 's' : '';
        const baseWord = lastChar ? trimmedWord.slice(0, -1) : trimmedWord;
        return baseWord.split('').join(' ') + (lastChar ? `'` + lastChar : '') + punctuation;
      }

      return trimmedWord.replace(/(?<=\w)[-.]+(?=\w)/g, ' ') + punctuation;
    }).join(' ').replace(/\bjs\b/g, 'J S');
  };

  const playNextAudio = () => {
    if (currentAudioIndex < audioUrls.length && !isPlayingRef.current) {
      const currentAudio = audioUrls[currentAudioIndex];
      
      // Set transcript but skip audio play if url is "err"


      if (currentAudio.url === "err") {
        setCurrentAudioIndex((prevIndex) => prevIndex + 1);

        setAiTranscript(prevTranscript => [
          ...prevTranscript,
          { text: "<Speech Error> " + cleanText(currentAudio.text), time: new Date().getTime() / 1000, role: "ai" }
        ]);

        return;
      }

      setAiTranscript(prevTranscript => [
        ...prevTranscript,
        { text: cleanText(currentAudio.text), time: new Date().getTime() / 1000, role: "ai" }
      ]);

      audioRef.current = new Audio(currentAudio.url);
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

  const splitIntoSentences = (paragraph) => {
    // replace any fullstops between letters with a temporary marker
    const withProtectedFullstops = paragraph.replace(/(?<=\w)\.(?=\w)/g, '__FULLSTOP__');
    
    // split on sentence endings
    const sentenceRegex = /[^.!?]+[.!?](?:\s|$)/g;
    const sentences = withProtectedFullstops.match(sentenceRegex) || [];
    
    // handle any remaining text after the last ending punctuation
    const lastPart = withProtectedFullstops.split(/[.!?](?:\s|$)/).pop();
    
    if (lastPart && lastPart.trim() !== '') {
        sentences.push(lastPart.trim());
    }

    // restore protected fullstops and remove ending punctuation
    return sentences
        .map(sentence => 
            sentence
                .trim()
                .replace(/__FULLSTOP__/g, '.')
                .replace(/[.]$/, '')
        );
  }


  useEffect(() => {
    playSpeakerRef.current = (transcript) => {
      setError('');
      setAudioUrls([]);
      setCurrentAudioIndex(0);
      isPlayingRef.current = false;

      const sentences = splitIntoSentences(transcript);
      const newAudioUrls = [];

      console.log("Sentences:", sentences);

      const fetchAudio = async (sentence) => {
        const fetchPromise = fetch(`${ttsApiPath}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: processTextForTTS(sentence).trim() })
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout after 3 seconds')), 3000)
        );

        return Promise.race([fetchPromise, timeoutPromise]);
      };

      const getAudioUrls = async () => {
        for (const sentence of sentences) {
          try {
            const response = await fetchAudio(sentence);

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            newAudioUrls.push({ url: audioUrl, text: sentence.trim() });
          } catch (err) {
            setError(`Error: ${err.message}`);
            newAudioUrls.push({ url: "err", text: sentence.trim() });
          }

          setAudioUrls([...newAudioUrls]);
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
      {/* Display error messages if needed */}
    </div>
  );
};

export default Speaker;
