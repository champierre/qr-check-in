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
        this.lastFaceDetectionTime = Date.now();
        this.noFaceTimeout = null;
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
     * Clear the recognized member ID and related fields
     */
    clearRecognizedId() {
        // Clear member ID
        const memberIdInput = document.getElementById('memberId');
        if (memberIdInput) {
            memberIdInput.value = '';
        }
        
        // Clear name field
        const nameInput = document.getElementById('memberName');
        if (nameInput) {
            nameInput.value = '';
        }
        
        // Clear grade/faculty/department field
        const gradeInput = document.getElementById('memberDetail');
        if (gradeInput) {
            gradeInput.value = '';
        }
        
        // Deselect all radio buttons
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.checked = false;
        });
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

                // Start timer to clear ID if no face is detected for 5 seconds
                const currentTime = Date.now();
                if (!this.noFaceTimeout) {
                    this.noFaceTimeout = setTimeout(() => {
                        // If 5 seconds have passed since last face detection, clear the ID
                        
                        if (currentTime - this.lastFaceDetectionTime >= 5000) {
                            this.clearRecognizedId();
                        }
                        this.noFaceTimeout = null;
                    }, 2000);
                }
                
                return null;
            }

            // Face detected, update the last detection time
            this.lastFaceDetectionTime = Date.now();
            
            // Clear the timeout if it exists
            if (this.noFaceTimeout) {
                clearTimeout(this.noFaceTimeout);
                this.noFaceTimeout = null;
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
                        rect.style.border = '2px solid #00FF00'; // Default green
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

            // Change rectangle color based on face recognition result
            const rect = document.getElementById('face-rectangle');
            if (rect) {
                if (bestMatch === null && Object.keys(this.faceDescriptors).length > 0) {
                    // Face detected but not recognized - red frame
                    rect.style.border = '2px solid #FF0000';
                    // Clear fields when unrecognized face is detected
                    this.clearRecognizedId();
                } else {
                    // Face recognized or no face data available - green frame
                    rect.style.border = '2px solid #00FF00';
                }
            }

            return bestMatch;
        } catch (error) {
            console.error('Error recognizing face:', error);
            return null;
        }
    }
}
