/**
 * @fileOverview Face recognition for QR check-in
 */

/**
 * Face recognition class
 */
class FaceRecognition {
    constructor() {
        this.isModelLoaded = false;
        this.faceDescriptors = {};
        this.loadFaceData();
        this.initModels();
    }

    /**
     * Initialize face-api.js models
     */
    async initModels() {
        try {
            // モデルのパスを設定
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            this.isModelLoaded = true;
            console.log('Face recognition models loaded');
        } catch (error) {
            console.error('Error loading face recognition models:', error);
        }
    }

    /**
     * Load face descriptors from Google Spreadsheet
     */
    async loadFaceData() {
        const faceData = await memberRegister.getFaces();
        if (faceData) {
            try {
                this.faceDescriptors = Object.fromEntries(
                    Object.entries(faceData).map(([key, value]) => [key, JSON.parse(value)])
                );
                console.log('Loaded face descriptors from Google Spreadsheet');
            } catch (error) {
                console.error('Error parsing face descriptors from Google Spreadsheet:', error);
                this.faceDescriptors = {};
            }
        }
    }

    /**
     * Recognize a face and return the matching member ID
     * @returns {Promise<string|null>} - Member ID if recognized, null otherwise
     */
    async recognizeFace() {
        if (!this.isModelLoaded) {
            console.error('Face recognition models not loaded yet');
            return null;
        }

        try {
            // Get the video element from the QR scanner
            const videoElement = document.querySelector('#reader video');
            if (!videoElement || !videoElement.srcObject) {
                return null;
            }

            // Detect faces in the video
            const detections = await faceapi.detectSingleFace(
                videoElement, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                // Hide the face rectangle if it exists when no face is detected
                const rect = document.getElementById('face-rectangle');
                if (rect) {
                    rect.style.display = 'none';
                }
                return null;
            }

            if (detections.detection) {
                const qrElement = document.getElementById('reader__scan_region');
                const resizedDetection = faceapi.resizeResults(detections.detection, {
                    width: qrElement.clientWidth,
                    height: qrElement.clientHeight
                });
                const box = resizedDetection.box;

                if (qrElement) {
                    // Create a div for the face rectangle if it doesn't exist
                    let rect = document.getElementById('face-rectangle');
                    if (!rect) {
                        rect = document.createElement('div');
                        rect.id = 'face-rectangle';
                        rect.style.position = 'absolute';
                        rect.style.border = '2px solid #00FF00';
                        rect.style.zIndex = '1000';
                        qrElement.appendChild(rect);
                    }

                    // Show the rectangle
                    rect.style.display = 'block';
                    
                    // Position the rectangle (horizontally flipped)
                    rect.style.left = `${qrElement.clientWidth - box.x - box.width}px`;
                    rect.style.top = `${box.y}px`;
                    rect.style.width = `${box.width}px`;
                    rect.style.height = `${box.height}px`;
                }
            }

            // Compare with stored face descriptors
            const currentDescriptor = detections.descriptor;
            let bestMatch = null;
            let bestDistance = 0.6; // Threshold for face recognition (lower is more strict)

            for (const [memberId, descriptor] of Object.entries(this.faceDescriptors)) {
                const distance = faceapi.euclideanDistance(
                    currentDescriptor,
                    new Float32Array(descriptor)
                );
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = memberId;
                }
            }

            return bestMatch;
        } catch (error) {
            console.error('Error recognizing face:', error);
            return null;
        }
    }
}
