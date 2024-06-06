let mediaRecorder;
let audioChunks = [];
let audioContext;
let audioBuffer;
let sourceNode;
let gainNode;
let isRecording = false;

document.getElementById('record').addEventListener('click', startRecording);
document.getElementById('stop').addEventListener('click', stopRecording);
document.getElementById('play').addEventListener('click', playAudio);
document.getElementById('download').addEventListener('click', downloadAudio);

function startRecording() {
    audioChunks = [];
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        
        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            loadAudio(audioUrl);
        });
        
        document.getElementById('record').disabled = true;
        document.getElementById('stop').disabled = false;
        document.getElementById('play').disabled = true;
        document.getElementById('download').disabled = true;
    });
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('record').disabled = false;
    document.getElementById('stop').disabled = true;
    document.getElementById('play').disabled = false;
    document.getElementById('download').disabled = false;
}

function loadAudio(audioUrl) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
            audioBuffer = buffer;
        });
}

function applyNoiseGate(buffer) {
    const threshold = 0.0015; // Adjust this threshold as needed
    const channelData = buffer.getChannelData(0.5);

    for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) < threshold) {
            channelData[i] = 0;
        }
    }

    return buffer;
}

function playAudio() {
    if (sourceNode) {
        sourceNode.stop();
    }

    audioBuffer = applyNoiseGate(audioBuffer);

    sourceNode = audioContext.createBufferSource();
    gainNode = audioContext.createGain();
    const pitchValue = parseFloat(document.getElementById('pitch').value);

    sourceNode.buffer = audioBuffer;
    sourceNode.playbackRate.value = pitchValue;

    sourceNode.connect(gainNode).connect(audioContext.destination);
    sourceNode.start(0);
}

function downloadAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'recording.wav';
    link.click();
}
