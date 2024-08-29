import React, { useRef, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [livenessResult, setLivenessResult] = useState(null);

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStreaming(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopStreaming = () => {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
    setStreaming(false);
  };

  const handleDetectLiveness = async () => {
    // Placeholder for actual liveness detection logic
    setLivenessResult({ message: "Simulating liveness detection..." });

    try {
      const response = await axios.post(
        "http://localhost:3001/detect-liveness"
      );
      setLivenessResult(response.data);
    } catch (error) {
      console.error("Error detecting liveness:", error);
      setLivenessResult({ error: error.message });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Face Liveness Detection</h1>
        {!streaming ? (
          <button onClick={startStreaming}>Start Video</button>
        ) : (
          <button onClick={stopStreaming}>Stop Video</button>
        )}
        <video ref={videoRef} width="640" height="480" autoPlay></video>
        <button onClick={handleDetectLiveness} disabled={!streaming}>
          {streaming ? "Detect Liveness" : "Start Video to Enable Detection"}
        </button>
        {livenessResult && <pre>{JSON.stringify(livenessResult, null, 2)}</pre>}
      </header>
    </div>
  );
}

export default App;
