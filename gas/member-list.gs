const activeSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
    const reqParam = e.parameter;//パラメーターを取得
    switch (reqParam.action) {//actionパラメーターの内容によって処理を分岐
        case "find": // return member data
            {
                const memberId = reqParam.id;
                const data = getMemberData(memberId);
                return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
            }
            break;
        default:
            {
                const result = 'did nothing';
                return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
            }
            break;
    }
}

// デバッグ用の関数
function doGetTest() {
    //eの作成
    var e = {};
    e.parameter = {
        action: 'find',
        id: '0d6v',
    };
    //呼び出す。
    doGet(e);
}

/** column list
 * @type {Array<string>} column list
 */
const columnList = ['email', 'name', 'school', 'detail', 'card type', 'card URL', 'ID', 'register date', 'update date', '3D printer Sermoon V1', 'UV printer birdland', 'laser cutter Helix', 'photo printer', 'A1 printer', 'milling MonoFab', 'sewing Vivace', 'soldering'];

const emailColumn = columnList.indexOf('email') + 1;
const nameColumn = columnList.indexOf('name') + 1;
const cardTypeColumn = columnList.indexOf('card type') + 1;
const cardURLColumn = columnList.indexOf('card URL') + 1;
const idColumn = columnList.indexOf('ID') + 1;
const registerDateColumn = columnList.indexOf('register date') + 1;

function getMemberData(memberId) {
    const dataSheet = activeSpreadSheet.getSheetByName('Data');
    const data = dataSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
        if (data[i][idColumn - 1] == memberId) {
            return data[i];
        }
    }
    return null;
}

function testGetMemeberData() {
    console.log(getMemberData('0d6v'));
}

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    const menu = ui.createMenu('Membership');
    menu.addItem('Create Cards', 'fillEmptyCardUrl')
    // menu.addItem('Fill empty ID', 'fillEmptyMemberId')
    menu.addToUi();
}

function fillSlide(slide, id, qrURL, name) {
    slide.getPageElements().forEach(elm => {
        // Logger.log(elm.getPageElementType());
        // Logger.log(elm.getTitle());
        if (elm.getTitle() === 'QR') {
            if (elm.getPageElementType() === SlidesApp.PageElementType.IMAGE) {
                elm.asImage().replace(qrURL);
            }
            if (elm.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
                elm.asShape().replaceWithImage(qrURL);
            }
        }
        if (elm.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
            elm.asShape().getText().replaceAllText('{{id}}', id);
            elm.asShape().getText().replaceAllText('{{name}}', name);
        }
    })
}

function fillCardData(card, id, qrURL, name) {
    const slides = card.getSlides();
    slides.forEach(sld => {
        fillSlide(sld, id, qrURL, name);
    });
}

function updateCardsByRange(range) {
    const dataSheet = activeSpreadSheet.getSheetByName('Data');
    const startRow = range.getRow();
    const startColumn = 1;
    const numRows = range.getNumRows();
    const cardDataRows = dataSheet.getRange(startRow, startColumn, numRows, dataSheet.getLastColumn()).getValues();

    const workFolder = DriveApp.getFileById(activeSpreadSheet.getId()).getParents().next();
    const cardFolder = workFolder.getFoldersByName('member-cards').next();

    for (var i = 0; i < cardDataRows.length; i++) {
        var row = cardDataRows[i];
        if (row[cardURLColumn - 1] != '') {
            console.log(`Skip for non empty card URL on row: ${startRow + i}`);
            continue;
        }
        let id = row[idColumn - 1];
        const name = row[nameColumn - 1];
        if (name == '') {
            console.log(`Skip for no name on row: ${startRow + i}`);
            continue;
        }
        if (id == '') {
            const newId = generateMemberId();
            dataSheet.getRange(startRow + i, idColumn).setValue(newId);
            dataSheet.getRange(startRow + i, registerDateColumn).setValue(Utilities.formatDate(new Date(), 'JST', 'yyyy/MM/dd'));
            id = newId;
            console.log(`Generate ID "${newId}" on row: ${startRow + i}`);
        }
        const qrURL = 'http://chart.apis.google.com/chart?chs=200x200&cht=qr&chl=' + id;
        const cardName = `${id}`;
        // clean up the previous cards
        const oldCards = DriveApp.getFilesByName(cardName);
        while (oldCards.hasNext()) {
            oldCards.next().setTrashed(true);
        }
        // create the new card
        let cardType = row[cardTypeColumn - 1];
        if (cardType === '') cardType = 'default';
        const cardTemplate = workFolder.getFilesByName(`card-template-${cardType}`).next();
        const cardFile = cardTemplate.makeCopy(cardName, cardFolder);
        const card = SlidesApp.openById(cardFile.getId());
        fillCardData(card, id, qrURL, name);
        const cardURL = cardFile.getUrl();
        dataSheet.getRange(startRow + i, cardURLColumn).setValue(cardURL);
        Logger.log(`update card: ${id} for ${name}`);
    }
}

function updateCardsBySelection() {
    const dataSheet = activeSpreadSheet.getActiveSheet();
    const ranges = dataSheet.getSelection().getActiveRangeList().getRanges();
    ranges.forEach(range => {
        updateCardsByRange(range);
    });
}

function testSelection() {
    var activeSheet = SpreadsheetApp.getActiveSheet();
    var rangeList = activeSheet.getRangeList(['A1:B4', 'D1:E4']);
    rangeList.activate();

    var selection = activeSheet.getSelection();
    // Current Cell: D1
    console.log('Current Cell: ' + selection.getCurrentCell().getA1Notation());
    // Active Range: D1:E4
    console.log('Active Range: ' + selection.getActiveRange().getA1Notation());
    // Active Ranges: A1:B4, D1:E4
    var ranges = selection.getActiveRangeList().getRanges();
    for (var i = 0; i < ranges.length; i++) {
        console.log('Active Ranges: ' + ranges[i].getA1Notation());
    }
    console.log('Active Sheet: ' + selection.getActiveSheet().getName());
}

function fillEmptyCardUrl() {
    const dataSheet = activeSpreadSheet.getSheetByName('Data');
    const dataRange = dataSheet.getDataRange();
    updateCardsByRange(dataRange);
}

/**
 * Generate ID
 */
function generateMemberId() {
    const characters = "abcdefghijklmnopqrstuvwxyz";
    let memberId = `${(new Date()).getFullYear() - 2023}`;
    while (true) {
        memberId += characters.charAt(Math.floor(Math.random() * characters.length));
        memberId += Math.floor(Math.random() * 10);
        memberId += characters.charAt(Math.floor(Math.random() * characters.length));
        if (!getMemberData(memberId)) {
            break;
        }
    }
    return memberId;
}

function testGenerateMemberId() {
    console.log(generateMemberId());
}

function fillEmptyMemberId() {
    const dataSheet = activeSpreadSheet.getSheetByName('Data');
    const firstRow = 2;
    const lastRow = dataSheet.getLastRow();
    for (let i = firstRow; i <= lastRow; i++) {
        let cell = dataSheet.getRange(i, idColumn);
        if (cell.isBlank()) {
            const newId = generateMemberId();
            cell.setValue(newId);
            console.log(newId);
        }
    }
}
