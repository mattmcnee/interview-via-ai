import os
import sys
import torch
import json
import logging
from pathlib import Path
from os.path import exists

# Add repository paths to system path
sys.path.append('hifi_gan')
sys.path.append('TTS_TT2')

# Import custom modules after path setup
from hparams import create_hparams
from model import Tacotron2
from env import AttrDict
from models import Generator
from denoiser import Denoiser

# Configure logging
logging.getLogger('matplotlib').setLevel(logging.WARNING)
logging.getLogger('numba').setLevel(logging.WARNING)
logging.getLogger('librosa').setLevel(logging.WARNING)

# Configuration
TACOTRON2_PATH = "res-30"
UNIVERSAL_HIFIGAN_PATH = "models/g_02500000"
SUPERRES_HIFIGAN_PATH = "models/Superres_Twilight_33000"
DICT_PATH = "merged.dict.txt"

# Check for GPU availability
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_pronunciation_dict(dict_path):
    thisdict = {}
    try:
        with open(dict_path, "r") as f:
            for line in reversed(f.read().splitlines()):
                word, pronunciation = line.split(" ", 1)
                thisdict[word] = pronunciation.strip()
    except FileNotFoundError:
        print(f"Warning: Pronunciation dictionary not found at {dict_path}")
        print("Downloading pronunciation dictionary...")
        import urllib.request
        url = 'https://github.com/justinjohn0306/FakeYou-Tacotron2-Notebook/releases/download/CMU_dict/merged.dict.txt'
        urllib.request.urlretrieve(url, dict_path)
        return load_pronunciation_dict(dict_path)
    return thisdict

def get_hifigan(model_path, config_name):
    # Load HiFi-GAN configuration
    config_path = os.path.join("hifi_gan", f"{config_name}.json")
    with open(config_path) as f:
        json_config = json.loads(f.read())
    h = AttrDict(json_config)
    
    # Initialize and load model
    torch.manual_seed(h.seed)
    hifigan = Generator(h).to(device)
    state_dict_g = torch.load(model_path, map_location=device)
    hifigan.load_state_dict(state_dict_g["generator"])
    hifigan.eval()
    hifigan.remove_weight_norm()
    
    return hifigan, h, Denoiser(hifigan, mode="normal").to(device)

def initialize_tacotron2(model_path):
    hparams = create_hparams()
    hparams.sampling_rate = 22050
    hparams.max_decoder_steps = 3000
    hparams.gate_threshold = 0.25
    
    model = Tacotron2(hparams).to(device)
    state_dict = torch.load(model_path, map_location=device)['state_dict']
    model.load_state_dict(state_dict)
    model.eval()
    
    return model, hparams

def initialize_models():
    print("Loading models and resources...")
    
    # Load pronunciation dictionary
    pronunciation_dict = load_pronunciation_dict(DICT_PATH)
    
    # Initialize models
    print("Loading Tacotron2...")
    model, hparams = initialize_tacotron2(TACOTRON2_PATH)
    
    print("Loading HiFi-GAN...")
    hifigan, h, denoiser = get_hifigan(UNIVERSAL_HIFIGAN_PATH, "config_v1")
    hifigan_sr, h2, denoiser_sr = get_hifigan(SUPERRES_HIFIGAN_PATH, "config_32k")
    
    print("Models loaded successfully!")
    
    return {
        'tacotron2': model,
        'hifigan': hifigan,
        'hifigan_sr': hifigan_sr,
        'h': h,
        'h2': h2,
        'denoiser': denoiser,
        'denoiser_sr': denoiser_sr,
        'pronunciation_dict': pronunciation_dict
    }
