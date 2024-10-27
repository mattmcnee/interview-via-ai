import numpy as np
import torch
import resampy
import scipy.signal
from text import text_to_sequence
from meldataset import mel_spectrogram, MAX_WAV_VALUE
import matplotlib.pyplot as plt
import io
import base64

def ARPA(text, pronunciation_dict, punctuation=r"!?,.;", EOS_Token=True):
    out = ''
    for word_ in text.split(" "):
        word = word_
        end_chars = ''
        while any(elem in word for elem in punctuation) and len(word) > 1:
            if word[-1] in punctuation:
                end_chars = word[-1] + end_chars
                word = word[:-1]
            else:
                break
        try:
            word_arpa = pronunciation_dict[word.upper()]
            word = "{" + str(word_arpa) + "}"
        except KeyError:
            pass
        out = (out + " " + word + end_chars).strip()
    if EOS_Token and out[-1] != ";":
        out += ";"
    return out

def generate_spectrograms(mel_outputs_postnet, alignments):
    plt.figure(figsize=(9, 3.6))
    plt.subplot(121)
    plt.imshow(mel_outputs_postnet.float().data.cpu().numpy()[0], 
               aspect='auto', origin='lower', interpolation='none')
    plt.subplot(122)
    plt.imshow(alignments.float().data.cpu().numpy()[0].T, 
               aspect='auto', origin='lower', interpolation='none')
    
    # Save plot to base64 string
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return image_base64

def synthesize_text(text, models, show_graphs=True, superres_strength=5):
    model = models['tacotron2']
    hifigan = models['hifigan']
    hifigan_sr = models['hifigan_sr']
    h = models['h']
    h2 = models['h2']
    denoiser = models['denoiser']
    denoiser_sr = models['denoiser_sr']
    
    if not text.endswith(";"):
        text = text + ";"
    
    with torch.no_grad():
        sequence = np.array(text_to_sequence(text, ['english_cleaners']))[None, :]
        sequence = torch.autograd.Variable(torch.from_numpy(sequence)).long()
        mel_outputs, mel_outputs_postnet, _, alignments = model.inference(sequence)
        
        spectrograms_base64 = None
        if show_graphs:
            spectrograms_base64 = generate_spectrograms(mel_outputs_postnet, alignments)

        # Generate audio with HiFi-GAN
        y_g_hat = hifigan(mel_outputs_postnet.float())
        audio = y_g_hat.squeeze() * MAX_WAV_VALUE
        audio_denoised = denoiser(audio.view(1, -1), strength=35)[:, 0]

        # Resample to 32k
        audio_denoised = audio_denoised.cpu().numpy().reshape(-1)
        normalize = (MAX_WAV_VALUE / np.max(np.abs(audio_denoised))) ** 0.9
        audio_denoised = audio_denoised * normalize
        wave = resampy.resample(
            audio_denoised,
            h.sampling_rate,
            h2.sampling_rate,
            filter="sinc_window",
            window=scipy.signal.windows.hann,
            num_zeros=8,
        )
        wave_out = wave.astype(np.int16)

        # Super-resolution
        wave = wave / MAX_WAV_VALUE
        wave = torch.FloatTensor(wave).to(torch.device("cpu"))
        new_mel = mel_spectrogram(
            wave.unsqueeze(0),
            h2.n_fft,
            h2.num_mels,
            h2.sampling_rate,
            h2.hop_size,
            h2.win_size,
            h2.fmin,
            h2.fmax,
        )
        y_g_hat2 = hifigan_sr(new_mel)
        audio2 = y_g_hat2.squeeze() * MAX_WAV_VALUE
        audio2_denoised = denoiser_sr(audio2.view(1, -1), strength=35)[:, 0]

        # Apply high-pass filter and mix
        audio2_denoised = audio2_denoised.cpu().numpy().reshape(-1)
        b = scipy.signal.firwin(
            101, cutoff=10500, fs=h2.sampling_rate, pass_zero=False
        )
        y = scipy.signal.lfilter(b, [1.0], audio2_denoised)
        y *= superres_strength
        y_out = y.astype(np.int16)
        y_padded = np.zeros(wave_out.shape)
        y_padded[: y_out.shape[0]] = y_out
        sr_mix = wave_out + y_padded
        sr_mix = sr_mix / normalize

        return sr_mix.astype(np.int16), h2.sampling_rate, spectrograms_base64
