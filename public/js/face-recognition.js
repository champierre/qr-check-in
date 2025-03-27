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
        this.messageShowTime = 0; // Track when the message was shown
        this.messageHideTimeout = null; // Timeout for hiding the message
        this.loadFaceData();
        this.initModels();
        // Initialize the message container to reserve space
        setTimeout(() => this.initMessageContainer(), 500); // Slight delay to ensure DOM is ready
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

                // Remove face registration message when no face is detected
                this.removeFaceRegistrationMessage();

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
            let confidence = 0;
            const minimumConfidence = 50; // Minimum confidence threshold (50%)

            for (const [memberId, descriptor] of Object.entries(this.faceDescriptors)) {
                const distance = faceapi.euclideanDistance(
                    currentDescriptor,
                    new Float32Array(descriptor)
                );
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    // Calculate confidence (0 to 100%)
                    // Lower distance means higher confidence
                    // 0.6 is the threshold, 0 would be perfect match
                    const calculatedConfidence = Math.round((1 - distance / 0.6) * 100);
                    // Ensure confidence is between 0 and 100
                    confidence = Math.max(0, Math.min(100, calculatedConfidence));
                    
                    // Only consider it a match if confidence is at least 50%
                    if (confidence >= minimumConfidence) {
                        bestMatch = memberId;
                    } else {
                        // Below minimum confidence threshold, don't consider it a match
                        bestMatch = null;
                    }
                }
            }

            // Change rectangle color based on face recognition result
            const rect = document.getElementById('face-rectangle');
            if (rect) {
                if (bestMatch === null && Object.keys(this.faceDescriptors).length > 0) {
                    // Face detected but not recognized or below confidence threshold - red frame
                    rect.style.border = '2px solid #FF0000';
                    // Clear fields when unrecognized face is detected
                    this.clearRecognizedId();
                    
                    // Add message for face registration with confidence level
                    // If we found a potential match but below threshold, show that confidence
                    this.showFaceRegistrationMessage(confidence); 
                } else if (bestMatch !== null) {
                    // Face recognized with sufficient confidence - green frame
                    rect.style.border = '2px solid #00FF00';
                    // Remove face registration message when face is recognized
                    this.removeFaceRegistrationMessage();
                    // Display confidence level
                    this.showConfidenceLevel(confidence, bestMatch);
                } else {
                    // No face data available - green frame
                    rect.style.border = '2px solid #00FF00';
                    // Remove face registration message
                    this.removeFaceRegistrationMessage();
                }
            }

            return bestMatch;
        } catch (error) {
            console.error('Error recognizing face:', error);
            return null;
        }
    }

    /**
     * Initialize message container
     * Creates a container for the face registration message that maintains its height
     */
    initMessageContainer() {
        // Check if container already exists
        if (document.getElementById('face-registration-container')) {
            return;
        }

        // Find the face registration link container
        const instructionDiv = document.querySelector('#instructions .instruction');
        if (!instructionDiv) return;

        // Create container element with fixed height
        const container = document.createElement('div');
        container.id = 'face-registration-container';
        container.style.height = '24px'; // Fixed height to prevent layout shifts
        container.style.margin = '10px 0';
        container.style.width = '100%';
        container.style.textAlign = 'center'; // Center-align the text
        
        // Create message element inside container (initially hidden)
        const messageElement = document.createElement('p');
        messageElement.id = 'face-registration-message';
        messageElement.textContent = '認識できない顔を検出しました。顔情報を登録できます。';
        messageElement.style.color = '#FF0000';
        messageElement.style.fontWeight = 'bold';
        messageElement.style.margin = '0';
        messageElement.style.display = 'none'; // Initially hidden
        messageElement.style.textAlign = 'center'; // Ensure text is centered
        
        container.appendChild(messageElement);
        
        // Insert after the face registration link
        const linkParagraph = instructionDiv.querySelector('p:nth-child(2)');
        if (linkParagraph) {
            linkParagraph.after(container);
        } else {
            instructionDiv.appendChild(container);
        }
    }

    /**
     * Show face registration message with confidence level
     * @param {number} confidence - Confidence level (0-100)
     */
    showFaceRegistrationMessage(confidence = 0) {
        // Ensure container exists
        this.initMessageContainer();
        
        // Show the message with confidence level
        const message = document.getElementById('face-registration-message');
        if (message) {
            message.textContent = `認識できない顔を検出しました。顔情報を登録できます。(確からしさ: ${confidence}%)`;
            message.style.color = '#FF0000'; // Ensure text is red
            message.style.display = 'block';
            
            // Record the time when the message was shown
            this.messageShowTime = Date.now();
            
            // Clear any existing hide timeout
            if (this.messageHideTimeout) {
                clearTimeout(this.messageHideTimeout);
                this.messageHideTimeout = null;
            }
        }
    }

    /**
     * Show confidence level for recognized face
     * @param {number} confidence - Confidence level (0-100)
     * @param {string} memberId - Recognized member ID
     */
    showConfidenceLevel(confidence, memberId) {
        // Ensure container exists
        this.initMessageContainer();
        
        // Show confidence level message
        const message = document.getElementById('face-registration-message');
        if (message) {
            message.textContent = `顔を認識しました: ID ${memberId} (確からしさ: ${confidence}%)`;
            message.style.color = '#008800'; // Green color for recognized face
            message.style.display = 'block';
            
            // Record the time when the message was shown
            this.messageShowTime = Date.now();
            
            // Clear any existing hide timeout
            if (this.messageHideTimeout) {
                clearTimeout(this.messageHideTimeout);
                this.messageHideTimeout = null;
            }
            
            // Set timeout to hide the message after 3 seconds
            this.messageHideTimeout = setTimeout(() => {
                if (message) {
                    message.style.display = 'none';
                    // Reset color for future messages
                    message.style.color = '#FF0000';
                }
                this.messageHideTimeout = null;
            }, 3000);
        }
    }

    /**
     * Hide face registration message
     */
    removeFaceRegistrationMessage() {
        const message = document.getElementById('face-registration-message');
        if (!message) return;
        
        // Check if 5 seconds have passed since the message was shown
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.messageShowTime;
        const minimumDisplayTime = 5000; // 5 seconds
        
        if (elapsedTime >= minimumDisplayTime) {
            // 5 seconds have passed, hide the message immediately
            message.style.display = 'none';
        } else if (!this.messageHideTimeout) {
            // Less than 5 seconds have passed, set a timeout to hide after the remaining time
            const remainingTime = minimumDisplayTime - elapsedTime;
            this.messageHideTimeout = setTimeout(() => {
                const messageElement = document.getElementById('face-registration-message');
                if (messageElement) {
                    messageElement.style.display = 'none';
                }
                this.messageHideTimeout = null;
            }, remainingTime);
        }
    }
}
