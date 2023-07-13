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
                memberName: data[0],
                memberSchool: data[1],
                memberDetail: data[2],
                cardType: data[3],
                cardURL: data[4],
                memberId: data[5],
                registerDate: data[6],
                updateDate: data[7],
                skill3DPrinterCube: data[8],
                skillUvPrinterBirdland: data[9],
                skillLaserCutterHelix: data[10],
                skillPhotoPrinter: data[11],
                skillLargePrinter: data[12],
                skillMonoFab: data[13],
                skillSingerVivace: data[14],
                skillSoldering: data[15],
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
