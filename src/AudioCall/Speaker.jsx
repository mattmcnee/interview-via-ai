import React, { useState } from 'react';

const Speaker = () => {
  const [textToSynthesize, setTextToSynthesize] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setTextToSynthesize(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAudioUrl(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_TACOTRON_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: textToSynthesize })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = "generated_audio.wav"; // Fallback filename

      if (contentDisposition && contentDisposition.match(/filename="([^"]+)"/)) {
        filename = contentDisposition.match(/filename="([^"]+)"/)[1];
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);

    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={textToSynthesize}
          onChange={handleInputChange}
          placeholder="Enter text to synthesize"
          required
        />
        <button type="submit">Submit</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {audioUrl && (
        <audio controls>
          <source src={audioUrl} type="audio/wav" />
          Your browser does not support the audio tag.
        </audio>
      )}
    </div>
  );
};

export default Speaker;
