import React, { useState, useRef, useEffect } from 'react';
import { TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming";
import { StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";

/*
  After two whole days of trying to get stt to work
  and may services just not working
  and many instances of bad advice
  and google saying I'm not eligable
  this finally worked...
*/
const AmazonSTT = () => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [wsStatus, setWsStatus] = useState('disconnected');
  const mediaStream = useRef(null);
  const audioContext = useRef(null);
  const processor = useRef(null);
  const transcribeClient = useRef(null);
  const lastVoiceActivity = useRef(Date.now());
  const silenceTimeout = useRef(null);
  const SILENCE_THRESHOLD = 0.01;
  const SILENCE_DURATION = 5000; // 5 seconds

  // AWS Configuration
  const AWS_CONFIG = {
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    if (silenceTimeout.current) {
      clearTimeout(silenceTimeout.current);
      silenceTimeout.current = null;
    }
    setIsRecording(false);
    setWsStatus('disconnected');
  };

  const checkForSilence = () => {
    const now = Date.now();
    const timeSinceLastVoice = now - lastVoiceActivity.current;
    
    if (timeSinceLastVoice >= SILENCE_DURATION) {
      console.log('Recording complete - no voice input detected for', SILENCE_DURATION/1000, 'seconds');
      cleanup();
    } else {
      silenceTimeout.current = setTimeout(checkForSilence, 1000);
    }
  };

  const detectVoiceActivity = (audioData) => {
    // Calculate RMS of the audio buffer
    const rms = Math.sqrt(audioData.reduce((sum, x) => sum + x * x, 0) / audioData.length);
    
    if (rms > SILENCE_THRESHOLD) {
      lastVoiceActivity.current = Date.now();
    }
  };

  const startTranscription = async () => {
    try {
      setWsStatus('connecting');
      setError('');
      setText('');

      // Initialize Transcribe client
      transcribeClient.current = new TranscribeStreamingClient({
        ...AWS_CONFIG,
        endpoint: "https://transcribestreaming.us-east-1.amazonaws.com"
      });

      // Get microphone stream
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Setup audio processing
      audioContext.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(mediaStream.current);
      
      const bufferSize = 1024;
      processor.current = audioContext.current.createScriptProcessor(bufferSize, 1, 1);
      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

      let audioQueue = [];
      const CHUNK_SIZE = 8192;

      // Start transcription
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: "en-US",
        MediaSampleRateHertz: 16000,
        MediaEncoding: "pcm",
        AudioStream: {
          async *[Symbol.asyncIterator]() {
            while (true) {
              try {
                const pcmData = await new Promise((resolve) => {
                  processor.current.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    detectVoiceActivity(inputData);
                    audioQueue = audioQueue.concat(Array.from(inputData));
                    
                    if (audioQueue.length >= CHUNK_SIZE) {
                      const chunk = audioQueue.slice(0, CHUNK_SIZE);
                      audioQueue = audioQueue.slice(CHUNK_SIZE);
                      resolve({
                        AudioEvent: {
                          AudioChunk: new Uint8Array(pcmEncode(chunk))
                        }
                      });
                    }
                  };
                });
                yield pcmData;
              } catch (error) {
                console.error('Error in audio processing:', error);
                break;
              }
            }
          }
        }
      });

      const response = await transcribeClient.current.send(command);
      
      // Start silence detection
      lastVoiceActivity.current = Date.now();
      silenceTimeout.current = setTimeout(checkForSilence, 1000);
      
      setIsRecording(true);
      setWsStatus('recording');

      // Process transcription results
      for await (const event of response.TranscriptResultStream) {
        const results = event.TranscriptEvent.Transcript.Results;
        if (results && results.length > 0) {
          if (!results[0].IsPartial) {
            const newText = results[0].Alternatives[0].Transcript;
            setText(prev => `${prev} ${newText}`.trim());
          }
        }
      }

    } catch (err) {
      setError('Transcription error: ' + err.message);
      console.error(err);
      cleanup();
    }
  };

  const pcmEncode = (input) => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const stopRecording = () => {
    cleanup();
  };

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={isRecording ? stopRecording : startTranscription}
        disabled={wsStatus === 'connecting'}
        style={{ 
          fontSize: '24px', 
          padding: '10px 20px',
          backgroundColor: isRecording ? '#ff4444' : 
                         wsStatus === 'connecting' ? '#cccccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: wsStatus === 'connecting' ? 'not-allowed' : 'pointer'
        }}
      >
        {wsStatus === 'connecting' ? '🔄 Connecting...' : 
         wsStatus === 'recording' ? '⏺️ Recording...' :
         isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
      </button>
      
      <div style={{
        marginTop: '10px',
        fontSize: '14px',
        color: wsStatus === 'recording' ? '#4CAF50' : 
               wsStatus === 'connecting' ? '#FFA500' : 
               wsStatus === 'error' ? '#ff4444' : '#666'
      }}>
        Status: {wsStatus}
      </div>
      
      {error && (
        <div style={{ 
          marginTop: '20px', 
          color: '#ff4444', 
          padding: '10px', 
          backgroundColor: '#ffebee',
          borderRadius: '5px' 
        }}>
          {error}
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        fontSize: '18px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '5px',
        minHeight: '100px',
        whiteSpace: 'pre-wrap'
      }}>
        {text || 'Speak to see real-time transcription...'}
      </div>
    </div>
  );
};

export default AmazonSTT;