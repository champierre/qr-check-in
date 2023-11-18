/**
 * @fileOverview QR code check-in
 */

/**
 * Get config from URL.
 * @returns {Object} config
 */
function getConfig() {
    const data = {};
    const url = new URL(window.location.href);
    data.findUrl = url.searchParams.get('findUrl');
    data.checkInUrl = url.searchParams.get('checkInUrl');
    return data;
}

const config = getConfig();

/**
 * @type {MemberRegister}
 */
const memberRegister = new MemberRegister(config.findUrl, config.checkInUrl);

const checkInForm = document.getElementById("checkInForm");

/**
 * Get member info from form.
 * @param {HTMLFormElement} form form element
 * @returns {Object} member info
 */
function getMemberInfo(form) {
    const formData = new FormData(form);
    const memberInfo = Object.fromEntries(formData.entries());
    return memberInfo;
}

/**
 * Check-in form submit event
 * @param {Event} ev event
 */
checkInForm.addEventListener("submit", async ev => {
    ev.preventDefault();
    const memberId = document.getElementById("memberId").value;
    if (memberId.length === 4) {
        await updateMemberInfo(memberId);
    }
    const memberInfo = getMemberInfo(checkInForm);
    await doCheckIn(memberInfo);
});

/**
 * Check-in sound
 * @type {Audio}
 */
const checkInSuccessSound = new Audio();
checkInSuccessSound.src = './js/check-in-success.mp3';

/**
 * Check-in failed sound
 * @type {Audio}
 */
const checkInFailSound = new Audio();
checkInFailSound.src = './js/check-in-fail.mp3';

/**
 * QR detected sound
 * @type {Audio}
 */
const qrDetectedSound = new Audio();
qrDetectedSound.src = './js/qr-detected.mp3';

/**
 * Clear member info
 */
function clearMemberInfo() {
    checkInForm.reset();
    updateSkillStatus({});
}

/**
 * Check if member is already checked in.
 * @param {string} memberId member ID
 * @returns {boolean} true if already checked in
 */
function isAlreadyCheckedIn(memberId) {
    if (lastCheckInCode === memberId) {
        if ((Date.now() - lastCheckInTime) < (1000 * 60 * 60)) {
            // less than 1 hour
            return true;
        }
    }
    return false;
}

/**
 * Do check-in from form data.
 * @param {Object} memberInfo member info
 * @returns {Promise<void>}
 */
async function doCheckIn(memberInfo) {
    if (!memberInfo) {
        return;
    }
    if (memberInfo.memberName === '') {
        alert('「なまえ」を入力してください');
        return;
    }
    if (isAlreadyCheckedIn(memberInfo.memberId)) {
        checkInFailSound.play();
        return new Promise(resolve => {
            document.getElementById('notification-already-checked-in').style.display = 'block';
            setTimeout(function () {
                document.getElementById('notification-already-checked-in').style.display = 'none';
                clearMemberInfo();
                resolve();
            }, 2000);
        });
    }
    try {
        const result = await memberRegister.checkIn(memberInfo);
        lastCheckInCode = memberInfo.memberId;
        lastCheckInTime = Date.now();
        checkInSuccessSound.play();
        return new Promise(resolve => {
            document.getElementById('notification-check-in').style.display = 'block';
            setTimeout(function () {
                document.getElementById('notification-check-in').style.display = 'none';
                clearMemberInfo();
                resolve();
            }, 3000);
        });
    } catch (e) {
        console.log(e);
        checkInFailSound.play();
        alert(`チェックインできませんでした(T_T) ${memberInfo.memberId}: ${memberInfo.memberName} ${(new Date()).toLocaleTimeString()}`);
    }
}
/**
 * Update skill status from member data.
 * @param {Object} memberData member data
 */
function updateSkillStatus(memberData) {
    const skillNames = ['skill3DPrinterSermoon', 'skillUvPrinterBirdland', 'skillLaserCutterHelix', 'skillPhotoPrinter', 'skillA1Printer', 'skillMillingMonoFab', 'skillSewingVivace', 'skillSoldering'];
    skillNames.forEach(skillName => {
        if (memberData[skillName] === 1) {
            document.querySelector(`#${skillName}`).classList.add('is-on');
        } else {
            document.querySelector(`#${skillName}`).classList.remove('is-on');
        }
    });
}

/**
 * Update member info from member Id
 * @param {string} id member ID
 */
async function updateMemberInfo(memberId) {
    const memberIdInput = document.querySelector('#memberId');
    memberIdInput.value = memberId
    document.querySelector('#memberName').value = ''
    const memberData = await memberRegister.find(memberId)
    if (memberData) {
        document.querySelector('#memberName').value = memberData.memberName;
        const schoolChoiceElements = document.getElementsByName('memberSchool');
        schoolChoiceElements.forEach(choice => {
            if (choice.value === memberData.memberSchool) {
                choice.checked = true;
            }
        });
        document.querySelector('#memberDetail').value = memberData.memberDetail;
        updateSkillStatus(memberData);
    } else {
        document.querySelector('#memberName').value = '見つかりません'
    }
}

/**
 * Watch ID field and update member info
 */
document.querySelector('#memberId').addEventListener('change', async ev => {
    const memberId = ev.target.value;
    if (memberId.length === 4) {
        await updateMemberInfo(memberId);
    }
});


const html5QrCode = new Html5Qrcode(/* element id */ "reader");
let lastCheckInCode = '';
let lastCheckInTime = 0;
let isReadyForScan = true;

/**
 * Callback when QR code is detected.
 * @param {string} decodedText decoded text
 * @param {Object} decodedResult decoded result
 */
async function onScanSuccess(decodedText, decodedResult) {
    if (!isReadyForScan) {
        return;
    }
    if (decodedText.length !== 4) {
        // not member ID
        return;
    }
    isReadyForScan = false;
    qrDetectedSound.play();
    console.log(`Code matched = ${decodedText}`, decodedResult);
    await updateMemberInfo(decodedText);
    const memberInfo = getMemberInfo(checkInForm);
    await doCheckIn(memberInfo); // auto check-in
    isReadyForScan = true;
}

/**
 * Calculate QR code finder box size.
 */
var qrBoxFunction = function (viewfinderWidth, viewfinderHeight) {
    // Square QR Box, with size = 80% of the min edge.
    var minEdgeSizeThreshold = 200;
    var edgeSizePercentage = 0.80;
    var minEdgeSize = (viewfinderWidth > viewfinderHeight) ?
        viewfinderHeight : viewfinderWidth;
    var qrBoxEdgeSize = Math.floor(minEdgeSize * edgeSizePercentage);
    if (qrBoxEdgeSize < minEdgeSizeThreshold) {
        if (minEdgeSize < minEdgeSizeThreshold) {
            return { width: minEdgeSize, height: minEdgeSize };
        } else {
            return {
                width: minEdgeSizeThreshold,
                height: minEdgeSizeThreshold
            };
        }
    }
    return { width: qrBoxEdgeSize, height: qrBoxEdgeSize };
}

/**
 * Create QR code scanner.
 */
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    {
        fps: 10,
        qrbox: qrBoxFunction,
        rememberLastUsedCamera: true,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
        ],
    });

html5QrcodeScanner.render(onScanSuccess);

// disable skill data for temporarily
document.querySelector('#skillData').style.display = 'none';
