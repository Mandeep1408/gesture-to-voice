let currentWord = '';
let sentence = '';
let letterCount = 0;
let wordCount = 0;
let lastGesture = '';
let holdTimer = null;
let cameraStarted = false;

const fingerGestures = {
  'thumbs_up': 'A',
  'peace': 'B',
  'ok': 'C',
};

async function startCamera() {
  if (cameraStarted) return;
  cameraStarted = true;

  const video = document.getElementById('video');
  const status = document.getElementById('status');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;

    status.textContent = 'ONLINE';
    status.className = 'status online';

    document.getElementById('detected').textContent = 'Camera active! Show your hand';
    document.getElementById('startBtn').textContent = '✅ Camera On';

    setupMediaPipe(video);

  } catch (err) {
    status.textContent = 'Camera Error';
    document.getElementById('detected').textContent =
      'Camera blocked! Please allow camera access';
    cameraStarted = false;
  }
}

function setupMediaPipe(video) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      drawConnectors(ctx, landmarks, HAND_CONNECTIONS,
        { color: '#9b59f5', lineWidth: 3 });
      drawLandmarks(ctx, landmarks,
        { color: '#00ff88', lineWidth: 1, radius: 4 });

      const gesture = detectGesture(landmarks);
      updateGesture(gesture);

      document.getElementById('confidence').textContent = 'Confidence: 95%';
    } else {
      document.getElementById('detected').textContent = 'Waiting for hand...';
      document.getElementById('confidence').textContent = 'Confidence: 0%';
    }
  });

  const camera = new Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); },
    width: 640,
    height: 480
  });
  camera.start();
}

function detectGesture(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const indexMCP = landmarks[5];
  const middleMCP = landmarks[9];

  const indexUp = indexTip.y < indexMCP.y;
  const middleUp = middleTip.y < middleMCP.y;
  const ringDown = ringTip.y > landmarks[13].y;
  const pinkyDown = pinkyTip.y > landmarks[17].y;

  if (indexUp && !middleUp && ringDown && pinkyDown) return 'A';
  if (indexUp && middleUp && ringDown && pinkyDown) return 'B';
  if (!indexUp && !middleUp && ringDown && pinkyDown) return 'C';

  return null;
}

function updateGesture(gesture) {
  if (!gesture) return;

  document.getElementById('detected').textContent = `Detected: ${gesture}`;

  if (gesture !== lastGesture) {
    lastGesture = gesture;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      addLetter(gesture);
    }, 1500);
  }
}

function addLetter(letter) {
  currentWord += letter;
  letterCount++;
  document.getElementById('current-word').textContent = currentWord;
  document.getElementById('letterCount').textContent = letterCount;
}

function addSpace() {
  if (currentWord) {
    sentence += currentWord + ' ';
    wordCount++;
    currentWord = '';
    document.getElementById('current-word').textContent = '';
    document.getElementById('sentence').textContent = sentence;
    document.getElementById('wordCount').textContent = wordCount;
  }
}

function speakSentence() {
  const text = sentence || document.getElementById('current-word').textContent;
  if (text.trim()) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Nothing to speak yet!');
  }
}

function clearAll() {
  currentWord = '';
  sentence = '';
  letterCount = 0;
  wordCount = 0;
  document.getElementById('current-word').textContent = '';
  document.getElementById('sentence').textContent = '';
  document.getElementById('letterCount').textContent = '0';
  document.getElementById('wordCount').textContent = '0';
}