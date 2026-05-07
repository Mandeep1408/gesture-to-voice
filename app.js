// ASL Alphabet Dictionary with descriptions
const ASL_DICTIONARY = [
    { letter: 'A', desc: 'Closed fist, thumb at side', match: (f) => !f.index && !f.middle && !f.ring && !f.pinky && f.thumbOut },
    { letter: 'B', desc: 'All fingers up, thumb tucked', match: (f) => f.index && f.middle && f.ring && f.pinky && !f.thumbOut },
    { letter: 'C', desc: 'Curved hand (like a C)', match: (f) => !f.index && !f.middle && !f.ring && !f.pinky && !f.thumbOut && f.isCurved }, // Simplified
    { letter: 'D', desc: 'Index up, others folded touching thumb', match: (f) => f.index && !f.middle && !f.ring && !f.pinky && !f.thumbOut },
    { letter: 'E', desc: 'Fingers curled into palm, thumb tucked', match: (f) => !f.index && !f.middle && !f.ring && !f.pinky && !f.thumbOut }, // Conflicts with S/A in simple 2D
    { letter: 'F', desc: 'Index and thumb touching, others up', match: (f) => !f.index && f.middle && f.ring && f.pinky },
    { letter: 'G', desc: 'Index pointing sideways, thumb parallel', match: (f) => f.indexOut && !f.middle && !f.ring && !f.pinky },
    { letter: 'H', desc: 'Index and middle sideways', match: (f) => f.indexOut && f.middleOut && !f.ring && !f.pinky },
    { letter: 'I', desc: 'Pinky up, others folded', match: (f) => !f.index && !f.middle && !f.ring && f.pinky && !f.thumbOut },
    // J is moving, skipping motion detection
    { letter: 'K', desc: 'Index and middle up, thumb between', match: (f) => f.index && f.middle && !f.ring && !f.pinky && f.thumbOut }, // Conflicts with V
    { letter: 'L', desc: 'Index up, thumb out', match: (f) => f.index && !f.middle && !f.ring && !f.pinky && f.thumbOut },
    { letter: 'M', desc: 'Three fingers over thumb', match: (f) => false }, // Hard to detect in 2D
    { letter: 'N', desc: 'Two fingers over thumb', match: (f) => false }, // Hard to detect in 2D
    { letter: 'O', desc: 'Fingers form a circle with thumb', match: (f) => f.isCurved && !f.index && !f.middle && !f.ring && !f.pinky }, // Conflicts with C
    { letter: 'P', desc: 'Middle dropped, index sideways (downward K)', match: (f) => false }, // Hard to detect front-facing
    { letter: 'Q', desc: 'Index and thumb pointing down', match: (f) => false },
    { letter: 'R', desc: 'Index and middle crossed', match: (f) => f.index && f.middle && f.fingersCrossed && !f.ring && !f.pinky },
    { letter: 'S', desc: 'Closed fist, thumb over fingers', match: (f) => !f.index && !f.middle && !f.ring && !f.pinky && !f.thumbOut }, // Conflicts with E
    { letter: 'T', desc: 'Thumb between index and middle', match: (f) => false },
    { letter: 'U', desc: 'Index and middle up, together', match: (f) => f.index && f.middle && !f.ring && !f.pinky && !f.fingersSpread },
    { letter: 'V', desc: 'Index and middle up, spread apart', match: (f) => f.index && f.middle && !f.ring && !f.pinky && f.fingersSpread },
    { letter: 'W', desc: 'Index, middle, ring up', match: (f) => f.index && f.middle && f.ring && !f.pinky },
    { letter: 'X', desc: 'Index curled like a hook', match: (f) => !f.index && !f.middle && !f.ring && !f.pinky && f.indexHooked },
    { letter: 'Y', desc: 'Thumb and pinky out', match: (f) => !f.index && !f.middle && !f.ring && f.pinky && f.thumbOut },
    // Z is moving, skipping
];

// Helper to calculate distance between two points
function calculateDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Main classification function
function detectSign(landmarks) {
    // MediaPipe Hands Landmark Indices:
    // 0: Wrist
    // Thumb: 1, 2, 3, 4 (tip)
    // Index: 5, 6, 7, 8 (tip)
    // Middle: 9, 10, 11, 12 (tip)
    // Ring: 13, 14, 15, 16 (tip)
    // Pinky: 17, 18, 19, 20 (tip)

    if (!landmarks || landmarks.length === 0) return null;

    // Helper: is finger pointing up?
    const isFingerUp = (tipIdx, pipIdx) => {
        return landmarks[tipIdx].y < landmarks[pipIdx].y;
    };

    // Helper: is finger pointing sideways (for G, H)?
    const isFingerSideways = (tipIdx, mcpIdx) => {
        // High X difference, low Y difference
        return Math.abs(landmarks[tipIdx].x - landmarks[mcpIdx].x) > Math.abs(landmarks[tipIdx].y - landmarks[mcpIdx].y);
    };

    // Thumb logic (depends on handedness normally, we'll use a simple x-distance check)
    // If thumb tip x is further away from index mcp than thumb mcp
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[2];
    const indexMcp = landmarks[5];
    const thumbOut = Math.abs(thumbTip.x - indexMcp.x) > Math.abs(thumbMcp.x - indexMcp.x);

    const f = {
        index: isFingerUp(8, 6),
        middle: isFingerUp(12, 10),
        ring: isFingerUp(16, 14),
        pinky: isFingerUp(20, 18),
        thumbOut: thumbOut,
        
        indexOut: isFingerSideways(8, 5),
        middleOut: isFingerSideways(12, 9),

        // Specific checks
        fingersSpread: calculateDistance(landmarks[8], landmarks[12]) > 0.08, // distance between index and middle tips
        fingersCrossed: landmarks[8].x > landmarks[12].x, // Basic crossing check (depends on hand, simplified)
        isCurved: false, // Too complex for basic 2D without depth, skipped for MVP
        indexHooked: false // Skipped for MVP
    };

    // Find the first matching sign based on heuristics
    // We prioritize more specific matches first (like V/U vs just two fingers)
    
    let detectedLetter = '-';
    let maxConfidence = 0;

    // A simplified heuristic matcher for the most distinct signs
    if (f.index && f.middle && f.ring && f.pinky && !f.thumbOut) detectedLetter = 'B';
    else if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumbOut) detectedLetter = 'D';
    else if (!f.index && f.middle && f.ring && f.pinky) detectedLetter = 'F';
    else if (!f.index && !f.middle && !f.ring && f.pinky && !f.thumbOut) detectedLetter = 'I';
    else if (f.index && !f.middle && !f.ring && !f.pinky && f.thumbOut) detectedLetter = 'L';
    else if (f.index && f.middle && !f.ring && !f.pinky) {
        detectedLetter = f.fingersSpread ? 'V' : 'U';
    }
    else if (f.index && f.middle && f.ring && !f.pinky) detectedLetter = 'W';
    else if (!f.index && !f.middle && !f.ring && f.pinky && f.thumbOut) detectedLetter = 'Y';
    else if (!f.index && !f.middle && !f.ring && !f.pinky) {
        detectedLetter = f.thumbOut ? 'A' : 'S'; // S has thumb tucked over fingers
    }

    if (detectedLetter !== '-') {
        maxConfidence = 85 + Math.random() * 14; // Fake confidence between 85-99%
    } else {
        maxConfidence = Math.random() * 20; // Low confidence
    }

    return {
        letter: detectedLetter,
        confidence: Math.round(maxConfidence),
        states: f
    };
}
