import React, { useState, useEffect, useRef } from 'react';
import { useAudioCall } from './AudioCallContext';
import { api } from '/src/utils/api';

const Speaker = () => {
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const { playSpeakerRef, setAiTranscript, ttsApiPath } = useAudioCall();

  const cleanText = (text) => text.replace(/["“”‘’]/g, '').trimEnd();



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
    }).join(' ').replace(/\bjs\b/g, 'J S').replace(/,/g, ' ');
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

    // I'm not sure what you mean by "Division." Could you please clarify or provide more details?
  // ['" Could you please clarify or provide more details?']

  const splitIntoSentences = (paragraph) => {
    if (!paragraph) return [];

    // Common abbreviations that end with periods
    const abbreviations = ['dr.', 'mr.', 'mrs.', 'ms.', 'prof.', 'sr.', 'jr.', 'etc.', 'inc.', 'ltd.', 'co.'];

    // Create regex pattern for abbreviations
    const abbrRegex = new RegExp(
        `\\b(${abbreviations.join('|')})\\s+`,
        'gi'
    );

    // Replace abbreviations with temporary marker
    const withProtectedAbbr = paragraph.replace(
        abbrRegex,
        (match) => match.replace('.', '__ABBR__')
    );

    // Replace periods between letters/numbers with temporary marker
    const withProtectedFullstops = withProtectedAbbr.replace(
        /(?<=\w)\.(?=\w)/g,
        '__FULLSTOP__'
    );

    // Split text into sentences, handling quotes properly
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const matches = withProtectedFullstops.match(sentenceRegex) || [];

    // Process each sentence
    const sentences = matches.map(sentence => {
        return sentence
            .trim()
            .replace(/\./g, '')
            // Restore protected abbreviations
            .replace(/__FULLSTOP__/g, '.')
            .replace(/__ABBR__/g, '.');
    });

    // Handle any remaining text
    const lastIndex = matches.join('').length;
    const remaining = withProtectedFullstops.slice(lastIndex).trim();
    
    if (remaining) {
        sentences.push(
            remaining
                .replace(/__FULLSTOP__/g, '.')
                .replace(/__ABBR__/g, '.')
        );
    }

    // Clean up quotation marks and spaces
    return sentences.map(sentence => {
        // Handle quotes at sentence boundaries
        return sentence
            .replace(/"/g, '')
            .trim();
    });
};

  useEffect(() => {
    playSpeakerRef.current = (transcript) => {
      setError('');
      setAudioUrls([]);
      setCurrentAudioIndex(0);
      isPlayingRef.current = false;

      const sentences = splitIntoSentences(transcript);
      const newAudioUrls = [];

      const fetchAudio = async (sentence) => {
        const fetchPromise = await api.post(`${import.meta.env.VITE_API_URL}/generateAudio`, { 
          path: ttsApiPath, 
          text: sentence
        }, 'blob');

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout after 3 seconds')), 3000)
        );

        return Promise.race([fetchPromise, timeoutPromise]);
      };

      const getAudioUrls = async () => {
        for (const sentence of sentences) {
          try {
            const response = await fetchAudio(sentence);
      
            if (response.status !== 200) {
              throw new Error('Network response was not ok');
            }
      
            const audioBlob = await response.data;
      
            // Create an object URL for the Blob
            const audioUrl = URL.createObjectURL(audioBlob);
      
            // Store the URL for later use
            newAudioUrls.push({ url: audioUrl, text: sentence.trim() });
          } catch (err) {
            setError(`Error: ${err.message}`);
            console.error(err);
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
