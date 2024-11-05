import { useEffect, useRef, useState } from 'react';
import exitIcon from '/src/assets/exit.svg';
import micOnIcon from '/src/assets/mic.svg';
import micOffIcon from '/src/assets/mic-off.svg';
import hourglassIcon from '/src/assets/hourglass.svg';
import videoOnIcon from '/src/assets/video.svg';
import videoOffIcon from '/src/assets/video-off.svg';

import ImageHexagon from '/src/components/ImageHexagon';
import VideoHexagon from '/src/components/VideoHexagon';

import './Display.scss';

import { useAudioCall } from './AudioCallContext';

const Display = ({ handleStartRecording, handleStopRecording, isRecording, error }) => {
    const transcriptRef = useRef(null);
    const [prevTranscript, setPrevTranscript] = useState([]);
    const [videoOn, setVideoOn] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null); // Add a ref to keep track of the video stream
    const [aiLoading, setAiLoading] = useState(false);

    const { timer, combinedTranscript, setMeetingState, isGeneratingResponseRef } = useAudioCall();

    useEffect(() => {
        if (combinedTranscript.length !== prevTranscript.length) {
            setPrevTranscript(combinedTranscript);
            if (transcriptRef.current) {
                transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
            }
        }
    }, [combinedTranscript]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && videoOn) {
                stopVideo();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Cleanup: Stop all video tracks when component unmounts
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [videoOn]);

    useEffect(() => {
        setAiLoading(isGeneratingResponseRef.current);
    }, [isGeneratingResponseRef]);

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

    const formatTime = (seconds) => {
        // Round to nearest 10 seconds
        seconds = Math.round(seconds / 10) * 10;
        
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className='interview-container'>
            <div className='call-members'>
                <VideoHexagon pulsing={false} spinning={false} clickable={true} videoRef={videoRef} videoOn={videoOn} name={"Matt"} uniqueId={2} />
                <ImageHexagon pulsing={aiLoading} spinning={false} clickable={false} uniqueId={1} />
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
                        <div className="button-text">Video On</div>
                    </button>
                ) : (
                    <button onClick={startVideo} className="mic-button">
                        <img src={videoOffIcon} alt="Turn on video" />
                        <div className="button-text">Video Off</div>
                    </button>
                )}

                <button className="mic-button">
                    <img src={hourglassIcon} alt="Check Time" />
                    <div className="button-text">{formatTime(timer)} Remaining</div>
                </button>

                <button onClick={() => setMeetingState("recap")} className="mic-button">
                    <img src={exitIcon} alt="Exit meeting" />
                    <div className="button-text">Leave</div>
                </button>
            </div>
        </div>
    );
};

export default Display;

