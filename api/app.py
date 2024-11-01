from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import io
import numpy as np
from scipy.io import wavfile
import time
import os
from setup_model import initialize_models
from run_model import synthesize_text

app = Flask(__name__)
CORS(app)

print("Initializing models...")
models = initialize_models()
print("Server ready!")

os.makedirs("generated_audio", exist_ok=True)

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        # Add all configuration options as optional parameters
        config = {
            'show_graphs': data.get('show_graphs', False),
            'max_duration': data.get('max_duration', 20),
            'stop_threshold': data.get('stop_threshold', 0.5),
            'superres_strength': data.get('superres_strength', 4),
            'use_pronunciation_dict': data.get('use_pronunciation_dict', True)
        }
        
        # Generate audio with all config options
        audio, sample_rate, spectrograms = synthesize_text(
            text, 
            models,
            **config
        )
        
        # Save audio to BytesIO
        audio_buffer = io.BytesIO()
        wavfile.write(audio_buffer, sample_rate, audio)
        audio_buffer.seek(0)
        
        # Save to file (optional)
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filename = f"tts_{timestamp}.wav"
        filepath = os.path.join("generated_audio", filename)
        wavfile.write(filepath, sample_rate, audio)
        
        # Return the audio file directly
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=filename
        ), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
