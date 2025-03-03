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
        const faceData = await memberRegister.faces();
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
     * Register a face for a member ID
     * @param {string} registrationId - Registration ID
     * @returns {Promise<boolean>} - True if registration was successful
     */
    async registerFace(registrationId) {
        if (!this.isModelLoaded) {
            console.error('Face recognition models not loaded yet');
            alert('顔認識モデルがまだロードされていません。しばらくお待ちください。');
            return false;
        }

        if (!registrationId) {
            alert('登録用IDを入力してください。');
            return false;
        }

        try {
            // Get the video element from the QR scanner
            const videoElement = document.querySelector('#reader video');
            if (!videoElement || !videoElement.srcObject) {
                alert('カメラが起動していません。QRコードスキャナーを起動してください。');
                return false;
            }

            // Detect faces in the video
            const detections = await faceapi.detectSingleFace(
                videoElement, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                alert('顔情報が検出されませんでした。カメラに顔を向けてください。');
                return false;
            }

            // Store the face descriptor with the registration ID
            this.faceDescriptors[registrationId] = Array.from(detections.descriptor);

            const faceData = { memberId: registrationId, descriptor: JSON.stringify(Array.from(detections.descriptor)) };
            memberRegister.registerFace(faceData);

            // Show success notification
            document.getElementById('notification-face-register').style.display = 'block';
            setTimeout(function () {
                document.getElementById('notification-face-register').style.display = 'none';
            }, 3000);

            return true;
        } catch (error) {
            console.error('Error registering face:', error);
            alert('顔情報の登録中にエラーが発生しました。');
            return false;
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
                return null;
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
