import { useEffect, useRef, useState } from 'react';
import exitIcon from '/src/assets/exit.svg';
import micOnIcon from '/src/assets/mic.svg';
import micOffIcon from '/src/assets/mic-off.svg';
import hourglassIcon from '/src/assets/hourglass.svg';
import videoOnIcon from '/src/assets/video.svg';
import videoOffIcon from '/src/assets/video-off.svg';

import Hexagon from '/src/components/Hexagon';
import VideoHexagon from '/src/components/VideoHexagon';

import './Display.scss';

const Display = ({ handleStartRecording, handleStopRecording, isRecording, combinedTranscript, error }) => {
    const transcriptRef = useRef(null);
    const [prevTranscript, setPrevTranscript] = useState([]);
    const [videoOn, setVideoOn] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null); // Add a ref to keep track of the video stream

    useEffect(() => {
        if (combinedTranscript.length !== prevTranscript.length) {
            setPrevTranscript(combinedTranscript);
            if (transcriptRef.current) {
                transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
            }
        }
    }, [combinedTranscript]);

    // Set up video stream
    const getCameraStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream; // Store the stream in a ref
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play(); // Play the video
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    };

    const startVideo = () => {
        setVideoOn(true);
        getCameraStream(); // Call the function to start the video stream
    };

    const stopVideo = () => {
        setVideoOn(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop()); // Stop each track of the stream
            streamRef.current = null; // Clear the stream reference
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null; // Clear the video source
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup: Stop all video tracks when component unmounts
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className='interview-container'>
            <div className='call-members'>
                <VideoHexagon pulsing={false} spinning={false} clickable={true} videoRef={videoRef} videoOn={videoOn} name={"Matt"} uniqueId={2} />
                <Hexagon pulsing={false} spinning={false} clickable={true} uniqueId={1} />
            </div>
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

                {videoOn ? (
                    <button onClick={stopVideo} className="mic-button">
                        <img src={videoOnIcon} alt="Turn off video" />
                        <div className="button-text">Stop Video</div>
                    </button>
                ) : (
                    <button onClick={startVideo} className="mic-button">
                        <img src={videoOffIcon} alt="Turn on video" />
                        <div className="button-text">Start Video</div>
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
{/* 
            {error && <div>Error: {error}</div>} */}
        </div>
    );
}

export default Display;
