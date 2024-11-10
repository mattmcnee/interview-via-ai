import React, { useState, useEffect, useRef } from 'react';

const TextToSpeech = () => {
  const [inputText, setInputText] = useState('');
  const [ttsApiPath, setTtsApiPath] = useState('');
  const [audioUrls, setAudioUrls] = useState([]);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

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
    }).join(' ').replace(/\bjs\b/g, 'J S').replace(/,/g, ' ');
  };

  const playNextAudio = () => {
    if (currentAudioIndex < audioUrls.length && !isPlayingRef.current) {
      const currentAudio = audioUrls[currentAudioIndex];

      if (currentAudio.url === "err") {
        setCurrentAudioIndex((prevIndex) => prevIndex + 1);
        return;
      }

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
    const withProtectedFullstops = paragraph.replace(/(?<=\w)\.(?=\w)/g, '__FULLSTOP__');
    const sentenceRegex = /[^.!?]+[.!?](?:\s|$)/g;
    const sentences = withProtectedFullstops.match(sentenceRegex) || [];
    const lastPart = withProtectedFullstops.split(/[.!?](?:\s|$)/).pop();

    if (lastPart && lastPart.trim() !== '') {
        sentences.push(lastPart.trim());
    }

    return sentences.map(sentence =>
      sentence.trim().replace(/__FULLSTOP__/g, '.').replace(/[.]$/, '')
    );
  };

  const handleSpeak = () => {
    if (!ttsApiPath) {
      setError('Please enter a valid TTS API path.');
      return;
    }

    setError('');
    setAudioUrls([]);
    setCurrentAudioIndex(0);
    isPlayingRef.current = false;

    const sentences = splitIntoSentences(inputText);
    const newAudioUrls = [];

    const fetchAudio = async (sentence) => {
      const fetchPromise = fetch(`http://${ttsApiPath}:5000/generate`, {
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
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text to speak"
      />
      <input
        type="text"
        value={ttsApiPath}
        onChange={(e) => setTtsApiPath(e.target.value)}
        placeholder="Enter TTS API path"
      />
      <button onClick={handleSpeak}>Speak</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default TextToSpeech;
