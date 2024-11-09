import React, { useState } from 'react';
import axios from 'axios';

const SimilarDocumentsButton = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); // New state for the retrieved message

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setMessage(''); // Reset message on button click

    try {
      const topK = 5; // Adjust as needed

      const result = await axios.post(`${import.meta.env.VITE_API_URL}/getSimilarDocuments`, {
        topK,
        text
      });

      console.log(result.data); // Log the response to the console
      setMessage(result.data.message); // Set the retrieved message to state
    } catch (err) {
      setError('An error occurred while fetching similar documents.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to find similar documents"
      />
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Loading...' : 'Get Similar Documents'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p>{message}</p>} {/* Display the message below the button */}
    </div>
  );
};

export default SimilarDocumentsButton;
