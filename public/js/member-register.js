
/**
 * column list
 * @type {Array<string>} list of column name
 */
const columnList = ['email', 'name', 'school', 'detail', 'card type', 'card URL', 'ID', 'register date', 'update date', '3D printer Sermoon V1', 'UV printer birdland', 'laser cutter Helix', 'photo printer', 'A1 printer', 'milling MonoFab', 'sewing Vivace', 'soldering'];

class MemberRegister {
    constructor() {
        this.findUrl = ''
        this.checkInUrl = ''
    }

    /**
     * Find member by ID
     * @param {string} memberId member ID
     * @returns {object} member data
     */
    async find(memberId) {
        const response = await fetch(this.findUrl + '?action=find&id=' + memberId)
        if (response.ok) {
            const data = await response.json()
            const member = {
                memberEmail: data[columnList.indexOf('email')],
                memberName: data[columnList.indexOf('name')],
                memberSchool: data[columnList.indexOf('school')],
                memberDetail: data[columnList.indexOf('detail')] ,
                cardType: data[columnList.indexOf('card type')],
                cardURL: data[columnList.indexOf('card URL')],
                memberId: data[columnList.indexOf('ID')],
                registerDate: data[columnList.indexOf('register date')],
                updateDate: data[columnList.indexOf('update date')],
                skill3DPrinterSermoon: data[columnList.indexOf('3D printer Sermoon V1')],
                skillUvPrinterBirdland: data[columnList.indexOf('UV printer birdland')],
                skillLaserCutterHelix: data[columnList.indexOf('laser cutter Helix')],
                skillPhotoPrinter: data[columnList.indexOf('photo printer')],
                skillA1Printer: data[columnList.indexOf('A1 printer')],
                skillMillingMonoFab: data[columnList.indexOf('milling MonoFab')],
                skillSewingVivace: data[columnList.indexOf('sewing Vivace')],
                skillSoldering: data[columnList.indexOf('soldering')],
            }
            return member
        } else {
            return null
        }
    }

    async checkIn(memberData) {
        const checkInData = { action: 'checkIn', ...memberData };
        const posting = async () => {
            const res = await fetch(this.checkInUrl, {
                method: "POST",
                body: JSON.stringify(checkInData),
            });
            const resData = await res.json();
            return resData;
        }
        return await retryWithDelay(posting, 3, 200, 'check in failed')
    }
}

function wait(ms) {
    new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    })
}

async function retryWithDelay(fn, retries = 3, interval = 50, finalErr = 'Retry failed') {
    try {
        const result = await fn()
        return result
    } catch (err) {
        console.log(err)
        if (retries <= 0) {
            return Promise.reject(finalErr)
        }
        await wait(interval)
        return retryWithDelay(fn, (retries - 1), interval, finalErr)
    }
}
