/**
 * @fileOverview QR code check-in
 * @name app.js
 * @module QRCheckIn
 */

/**
 * QR code check-in class
 * @class QRCheckIn
 */
class QRCheckIn {
    constructor() {
        /**
         * Canvas for video image data
         * @type {HTMLCanvasElement}
         */
        this.videoCanvas = document.createElement('canvas')
        this.videoCanvas.style.display = 'none'
    }

    /**
     * Update member info from member Id
     * @param {string} memberId member ID
     */
    async updateMemberInfo(memberId) {
        const memberIdInput = document.querySelector('#memberId');
        memberIdInput.value = memberId
        memberIdInput.dispatchEvent(new InputEvent('change'));
    }

    /**
     * Get image data from video
     * @param {video} video element
     * @returns {image} 2D image data
     */
    getImageData(video) {
        this.videoCanvas.width = video.videoWidth
        this.videoCanvas.height = video.videoHeight
        const ctx = this.videoCanvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        return ctx.getImageData(0, 0, video.videoWidth, video.videoHeight)
    }

    /**
     * Detect QR code from video
     * @param {video} video element
     */
    detectQR(video) {
        const image = this.getImageData(video)
        const code = jsQR(image.data, image.width, image.height)
        if (code && code.data) {
            const audio = new Audio();
            audio.src = './js/qr-detected.mp3';
            audio.play();
            // QR code detected
            this.updateMemberInfo(code.data)
            setTimeout(() => this.detectQR(video), 3000)
        } else {
            // QR code not detected
            setTimeout(() => this.detectQR(video), 200)
        }
    }

    /**
     * Start camera and detect QR code
     * @param {video} video element
     * @returns {Promise} Promise object represents camera stream
     * @throws {Error} if camera is not available
     */
    startDetection(video) {
        return navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: { facingMode: 'user' },
            })
            .then((stream) => {
                video.srcObject = stream
                video.onloadedmetadata = () => {
                    video.play()
                    this.detectQR(video)
                }
            })
    }
}
