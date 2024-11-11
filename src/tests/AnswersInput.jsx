import React, { useState } from 'react';
import template from '/src/assets/data.json';

const AnswersInput = () => {
  // Use state to handle form data
  const [formData, setFormData] = useState(template);

  // Handle changes in input or textarea
  const handleChange = (id, field, value) => {
    const updatedData = formData.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setFormData(updatedData);
  };

  // Handle download of JSON file with updated answers
  const handleDownload = () => {
    const json = JSON.stringify(formData, null, 2); // Convert to JSON string
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary <a> element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json'; // Filename for the download
    document.body.appendChild(a); // Append the element to the DOM
    a.click(); // Trigger the download
    document.body.removeChild(a); // Remove the element from the DOM
  };

  return (
    <div>
      {formData.map((item) => (
        <div key={item.id} style={{ margin: '0 auto 20px auto', minWidth: '400px', maxWidth: '800px' }}>
          <label>
            <strong>Title:</strong>
            <input
              type="text"
              value={item.title}
              onChange={(e) => handleChange(item.id, 'title', e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '4px' }}
            />
          </label>
          <label>
            <strong>Answer:</strong>
            <textarea
              value={item.answer}
              onChange={(e) => handleChange(item.id, 'answer', e.target.value)}
              style={{ display: 'block', width: '100%', height: '100px', padding: '4px' }}
            />
          </label>
        </div>
      ))}
      
      {/* Button to download the answers as a JSON file */}
      <button onClick={handleDownload} style={{ marginTop: '20px', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
        Download Answers as JSON
      </button>
    </div>
  );
};

export default AnswersInput;
