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
    await doCheckIn();
});

/**
 * Do check-in from form data.
 * @returns {Promise<void>}
 */
async function doCheckIn() {
    
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
        await doCheckIn(); // auto check-in
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
