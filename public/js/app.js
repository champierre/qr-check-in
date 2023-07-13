/**
 * @fileOverview QR code check-in
 */

/**
 * @type {MemberRegister}
 */
const memberRegister = new MemberRegister()
memberRegister.findUrl = config.findUrl
memberRegister.checkInUrl = config.checkInUrl

const qrCheckIn = new QRCheckIn()

const checkInForm = document.getElementById("checkInForm");
checkInForm.addEventListener("submit", async ev => {
    ev.preventDefault();

    const formData = new FormData(checkInForm);
    const memberData = Object.fromEntries(formData.entries());

    console.log(memberData);

    if (memberData.memberName === '') {
        alert('「なまえ」を入力してください');
        return;
    }

    try {
        const result = await memberRegister.checkIn(memberData);
        alert(`チェックインしました! ${result.id}: ${memberData.memberName} ${result.timestamp}`);
        // 完了時に入力値をクリア
        checkInForm.reset();
        updateSkillStatus({});

    } catch (e) {
        console.log(e);
        alert(`チェックインできませんでした(T_T) ${memberData.memberId}: ${memberData.memberName} ${(new Date()).toLocaleTimeString()}`);
    }
});

/**
 * Update skill status from member data.
 * @param {Object} memberData member data
 */
function updateSkillStatus(memberData) {
    const skillNames = ['skill3DPrinterCube', 'skillUvPrinterBirdland', 'skillLaserCutterHelix', 'skillPhotoPrinter', 'skillLargePrinter', 'skillMonoFab', 'skillSingerVivace', 'skillSoldering'];
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
    document.querySelector('#memberName').value = ''
    const memberData = await memberRegister.find(memberId)
    if (memberData) {
        document.querySelector('#memberName').value = memberData.memberName;
        const schoolChoice = document.getElementsByName('memberSchool');
        if (memberData.memberSchool === '初等部') {
            schoolChoice[0].checked = true;
        }
        if (memberData.memberSchool === '中等部') {
            schoolChoice[1].checked = true;
        }
        if (memberData.memberSchool === '高等部') {
            schoolChoice[2].checked = true;
        }
        if (memberData.memberSchool === '大学') {
            schoolChoice[3].checked = true;
        }
        if (memberData.memberSchool === '大学院') {
            schoolChoice[4].checked = true;
        }
        if (memberData.memberSchool === '教職員') {
            schoolChoice[5].checked = true;
        }
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

qrCheckIn.startDetection(document.querySelector('#qr-video'))
