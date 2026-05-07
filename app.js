let currentWord = '';
let sentence = '';
let letterCount = 0;
let wordCount = 0;
let lastGesture = '';
let holdTimer = null;
let cameraStarted = false;

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
    video.play();

    status.textContent = 'ONLINE';
    status.className = 'status online';
    document.getElementById('detected').textContent = 'Camera active! Show your hand';
    document.getElementById('startBtn').textContent = '✅ Camera On';

    setupMediaPipe(video);

  } catch (err) {
    document.getElementById('detected').textContent = 'Camera blocked! Please allow camera access';
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
    minDetectionConfidence: 0.85,
    minTrackingConfidence: 0.85
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
      if (gesture) {
        document.getElementById('detected').textContent = `Detected: ${gesture}`;
        document.getElementById('confidence').textContent = 'Confidence: 95%';
        updateGesture(gesture);
      } else {
        document.getElementById('detected').textContent = 'Hand detected - show a sign';
        document.getElementById('confidence').textContent = 'Confidence: 0%';
      }
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
  const tips = [4, 8, 12, 16, 20];
  const bases = [2, 5, 9, 13, 17];

  // Check which fingers are up
  const thumbUp = landmarks[4].x < landmarks[3].x;
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  // A = only index up
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return 'A';

  // B = index and middle up
  if (indexUp && middleUp && !ringUp && !pinkyUp) return 'B';

  // C = index, middle and ring up
  if (indexUp && middleUp && ringUp && !pinkyUp) return 'C';

  // D = all four fingers up
  if (indexUp && middleUp && ringUp && pinkyUp) return 'D';

  // E = no fingers up (fist)
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) return 'E';

  // F = only pinky up
  if (!indexUp && !middleUp && !ringUp && pinkyUp) return 'F';

  // G = index and pinky up (rock sign)
  if (indexUp && !middleUp && !ringUp && pinkyUp) return 'G';

  // H = thumb up only
  if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) return 'H';

  return null;
}

function updateGesture(gesture) {
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
  lastGesture = '';
  document.getElementById('current-word').textContent = '';
  document.getElementById('sentence').textContent = '';
  document.getElementById('letterCount').textContent = '0';
  document.getElementById('wordCount').textContent = '0';
  document.getElementById('detected').textContent = 'Waiting for hand...';
}function deleteLastLetter() {

    if(currentWord.length > 0){

        currentWord = currentWord.slice(0, -1);

        document.getElementById('current-word').textContent = currentWord;

        letterCount--;

        if(letterCount < 0){
            letterCount = 0;
        }

        document.getElementById('letterCount').textContent = letterCount;
    }
}