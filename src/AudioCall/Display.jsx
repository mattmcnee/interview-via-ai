import exitIcon from '/src/assets/exit.svg';
import micOnIcon from '/src/assets/mic.svg';
import micOffIcon from '/src/assets/mic-off.svg';
import hourglassIcon from '/src/assets/hourglass.svg';

const Display = ({ handleStartRecording, handleStopRecording, isRecording, combinedTranscript, error }) => {


    return (
        <div>
        <button onClick={handleStartRecording} disabled={isRecording}>
            Start Recording
        </button>
        <button onClick={handleStopRecording} disabled={!isRecording}>
            Stop Recording
        </button>

        <div>
            {combinedTranscript && combinedTranscript.map((segment, index) => (
                <div key={index} className="text-segment">
                    <p><strong>{segment.role}:</strong> {segment.text}</p>
                </div>
            ))}
        </div>

        {error && <div>Error: {error}</div>}
    </div>
    );
}

export default Display;