import React, { useState } from 'react';
import axios from 'axios';

const EmbeddingTester = () => {
  const [inputText, setInputText] = useState('');
  const [embeddings, setEmbeddings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/getEmbedding`,
        { inputText },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setEmbeddings(response.data.embedding);
    } catch (error) {
      console.error('Error fetching embeddings:', error);
      setError('Failed to fetch embeddings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Embedding Tester</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Enter text to generate embeddings:
            <textarea
              value={inputText}
              onChange={handleInputChange}
              rows="5"
              cols="60"
              placeholder="Type your text here..."
              required
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Embeddings'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {embeddings && (
        <div>
          <h2>Embeddings:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {JSON.stringify(embeddings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EmbeddingTester;
