import { useEffect, useRef, useState } from 'react';
import exitIcon from '/src/assets/exit.svg';
import micOnIcon from '/src/assets/mic.svg';
import micOffIcon from '/src/assets/mic-off.svg';
import hourglassIcon from '/src/assets/hourglass.svg';

import Hexagon from '/src/components/Hexagon';

import './Display.scss';

const Display = ({ handleStartRecording, handleStopRecording, isRecording, combinedTranscript, error }) => {
    const transcriptRef = useRef(null);
    const [prevTranscript, setPrevTranscript] = useState([]);

    useEffect(() => {
        if (combinedTranscript.length != prevTranscript.length) {
            setPrevTranscript
            if (transcriptRef.current) {
                transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
            }
        }
    }, [combinedTranscript]);

    return (
        <div className='interview-container'>
            <Hexagon pulsing={false} spinning={false} clickable={false}/>
            <div className='transcript-container' ref={transcriptRef}>
                {combinedTranscript && combinedTranscript.map((segment, index) => (
                    <div key={index} className="text-segment">
                        <span><strong>{segment.role}:</strong> {segment.text}</span>
                    </div>
                ))}
            </div>

            <div className="options-box">
                {isRecording ? (
                    <button onClick={handleStopRecording} className="mic-button">
                        <img src={micOnIcon} alt="Stop Recording" />
                        <div className="button-text">Recording</div>
                    </button>
                ) : (
                    <button onClick={handleStartRecording} className="mic-button">
                        <img src={micOffIcon} alt="Start Recording" />
                        <div className="button-text">Muted</div>
                    </button>
                )}

                <button onClick={() => alert("Time")} className="mic-button">
                    <img src={hourglassIcon} alt="Check Time" />
                    <div className="button-text">4:37</div>
                </button>

                <button onClick={() => alert("Exit meeting")} className="mic-button">
                    <img src={exitIcon} alt="Exit meeting" />
                    <div className="button-text">Leave</div>
                </button>
            </div>

            {error && <div>Error: {error}</div>}
        </div>
    );
}

export default Display;
