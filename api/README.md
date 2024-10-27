### Setup

```
sudo apt-get update
sudo apt-get install -y python3-venv python3-pip wget git tree

mkdir tts_project
cd tts_project

# Create Python virtual environment and activate it
python3 -m venv venv
source venv/bin/activate

# Clone repositories
git clone https://github.com/justinjohn0306/TTS-TT2.git TTS_TT2
git clone https://github.com/justinjohn0306/hifi-gan.git hifi_gan

# Install all required Python packages
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

# Create models directory and download HiFi-GAN models
mkdir -p models
cd models
wget https://github.com/justinjohn0306/tacotron2/releases/download/assets/g_02500000
wget https://github.com/justinjohn0306/tacotron2/releases/download/assets/Superres_Twilight_33000
cd ..

# Download pronunciation dictionary
wget https://github.com/justinjohn0306/FakeYou-Tacotron2-Notebook/releases/download/CMU_dict/merged.dict.txt

# Create directory for generated audio
mkdir generated_audio

# Upload Tacotron 2 model and move from home directory to 

# Check directory structure
tree -L 1
```


### Example PowerShell command to CPU only VM instance

```
# Specify the text to synthesize
$textToSynthesize = '{"text": "This is a full text of the C P U powered API"}' 

# Make the POST request and get the response
$response = Invoke-WebRequest -Uri "http://<External IP>:5000/generate" -Method Post -ContentType "application/json" -Body $textToSynthesize

# Get the filename from the Content-Disposition header
$contentDisposition = $response.Headers['Content-Disposition']
if ($contentDisposition -match 'filename="([^"]+)"') {
    $filename = $matches[1]
} else {
    # Fallback filename if not found
    $filename = "generated_audio.wav"
}

# Get the path to the Downloads folder
$downloadsPath = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
$filePath = Join-Path -Path $downloadsPath -ChildPath $filename

# Save the file to the Downloads folder as bytes
[System.IO.File]::WriteAllBytes($filePath, $response.Content)

Write-Host "File saved to $filePath"
```