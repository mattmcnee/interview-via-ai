# TTS API - Google VM Instance

Hosts the Tacotron 2 model and creates speech from provided text using it. Requires a GPU for realtime inference.

## Details
- Machine Type: n1-standard-1
- GPUs: 1 x NVIDIA T4
- OS: Debian GNU/Linux 12 (bookworm)
- Disk Space: 28GB Disk 

## Approximate Cost
- £2.10 per month (persistent disk space)
- £0.32 per hour (when running)

## Setup
This is provided as an overall guide and should not be considered an exhaustive list of every setup requirement.

### Cuda (Nvidia Drivers)

Cuda is needed for this code to run on the GPU. Google provides a version of Debian with Cuda installed, but this has a minimum disk space of 50GB. This code comfortably fits within a 28GB disk so if you're comfortable with Linux it's more cost effective to install it yourself.

### Project directory

Update packages and create the project directory

```
sudo apt-get update
sudo apt-get install -y python3-venv python3-pip wget git tree

mkdir tts_project
cd tts_project
```

### Virtual environment

You'll need to setup a virtual environment to manage the python packages.

```
python3 -m venv venv
source venv/bin/activate
```

### Pip installs
Some of these packages are quite large, hence the need for significant disk space.

```
pip install --upgrade pip
pip install tqdm
pip install resampy
pip install unidecode
pip install numpy
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install matplotlib
pip install scipy
pip install librosa
pip install IPython
pip install inflect
pip install tensorflow
pip install flask
pip install flask_cors
```

### Clone required repositories

This project builds on functionality provided by [justinjohn0306](https://github.com/justinjohn0306) and requires a local copy of certain Git repositories.

```
# Clone repositories
git clone https://github.com/justinjohn0306/TTS-TT2.git TTS_TT2
git clone https://github.com/justinjohn0306/hifi-gan.git hifi_gan

# Create models directory and download HiFi-GAN models
mkdir -p models
cd models
wget https://github.com/justinjohn0306/tacotron2/releases/download/assets/g_02500000
wget https://github.com/justinjohn0306/tacotron2/releases/download/assets/Superres_Twilight_33000
cd ..

# Download pronunciation dictionary
wget https://github.com/justinjohn0306/FakeYou-Tacotron2-Notebook/releases/download/CMU_dict/merged.dict.txt
```

### Upload Tacotron 2 model

Upload your finetuned model to the VM (this may take some time) and move it to the project directory. Commands are shown to move a model named "res-30".

```
cd ..
mv res-30 ~/tts_project/
cd tts_project
```

### Startup Script
Add this to the automation section of the VM Instance to make the server start up automatically when the machine starts.

```
cd /home/mattmwebdev/tts_project
source venv/bin/activate
export FLASK_APP=app.py
flask run --host=0.0.0.0 --port=5000
```

You can check if this is running.
```
ps aux | grep 'flask run'
```
Or you can cancel it.
```
sudo pkill -f 'flask run'
```

## Useful commands

If you're less used to Linux, here are some commands that may be useful.

- Run a python file: 
```
python3 app.py
```
- Get full file path: 
```
realpath myfile.txt
```