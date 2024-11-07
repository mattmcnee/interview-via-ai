import os
import time
import logging
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import io
import numpy as np
from scipy.io import wavfile
from setup_model import initialize_models
from run_model import synthesize_text
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.base import JobLookupError  # Import JobLookupError
import requests

# Load environment variables
load_dotenv()
API_URL = os.getenv("API_URL")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

logger.info("Initializing models...")
models = initialize_models()
logger.info("Server ready!")

os.makedirs("generated_audio", exist_ok=True)

# Inactivity timer settings
INACTIVITY_TIMEOUT = 120  # 2 minutes in seconds

def send_stop_vm_request():
    try:
        response = requests.post(f"{API_URL}/stopVM")
        logger.info(f"Stop VM request sent: {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"Failed to send stop VM request: {e}")

# Timer management using Flask-APScheduler
scheduler = BackgroundScheduler()

def reset_timer():
    try:
        scheduler.remove_job('stop_vm_job')
    except JobLookupError:
        # Ignore the error if the job doesn't exist
        pass

    scheduler.add_job(
        func=send_stop_vm_request,
        trigger='interval',
        seconds=INACTIVITY_TIMEOUT,
        id='stop_vm_job',
        replace_existing=True
    )
    logger.info(f"Inactivity timer reset. Will stop VM in {INACTIVITY_TIMEOUT} seconds.")

# Start the inactivity timer when the server starts
reset_timer()
scheduler.start()

@app.route('/health', methods=['GET'])
def health_check():
    # Reset the inactivity timer on health check
    reset_timer()
    return jsonify({'status': 'ACTIVE'}), 200

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        config = {
            'show_graphs': data.get('show_graphs', False),
            'max_duration': data.get('max_duration', 20),
            'stop_threshold': data.get('stop_threshold', 0.5),
            'superres_strength': data.get('superres_strength', 4),
            'use_pronunciation_dict': data.get('use_pronunciation_dict', True)
        }
        
        # Reset the inactivity timer
        reset_timer()
        
        # Generate audio
        audio, sample_rate, spectrograms = synthesize_text(
            text, 
            models,
            **config
        )
        
        # Save audio to BytesIO
        audio_buffer = io.BytesIO()
        wavfile.write(audio_buffer, sample_rate, audio)
        audio_buffer.seek(0)
        
        # Return audio file as response
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filename = f"tts_{timestamp}.wav"
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=filename
        ), 200
    except Exception as e:
        logger.error(f"Error in generate route: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
