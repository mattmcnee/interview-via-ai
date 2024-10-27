from flask import Flask, request, send_file
import io
import numpy as np
from scipy.io import wavfile
import time
import os
from setup_model import initialize_models
from run_model import synthesize_text

app = Flask(__name__)

# Initialize models at startup
print("Initializing models...")
models = initialize_models()
print("Server ready!")

# Create directory for generated audio
os.makedirs("generated_audio", exist_ok=True)

@app.route('/generate', methods=['POST'])  # Endpoint for audio generation
def generate():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return {'error': 'No text provided'}, 400
        
        text = data['text']
        # Set show_graphs to False by default
        show_graphs = False  
        superres_strength = data.get('superres_strength', 5)
        
        # Generate audio
        audio, sample_rate, _ = synthesize_text(  # Ignore spectrograms
            text, 
            models,
            show_graphs=show_graphs,
            superres_strength=superres_strength
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
        
        # Return the audio file in the response
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=filename
        ), 200
        
    except Exception as e:
        return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
