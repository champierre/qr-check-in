const activeSheet = SpreadsheetApp.getActiveSpreadsheet();

function checkIn(memberData) {
  const dataSheet = activeSheet.getSheetByName('CheckIn');
  const timestamp = toDateTimeEntry(Date.now());
  dataSheet.appendRow([
    timestamp,
    memberData.memberId,
    memberData.memberName,
    memberData.memberSchool,
    memberData.memberDetail,
  ]);
  return {id: memberData.memberId, timestamp: timestamp};
}

function toDateTimeEntry(epochTime) {
  const date = new Date(epochTime);
  //get timezone of spreadsheet
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

  //format date to readable format
  var formatted = Utilities.formatDate(date, tz, 'yyyy/MM/dd HH:mm:ss');

  return formatted;
}

function doPost(e) {
  // const reqParam = e.parameter;
  const reqParam = JSON.parse(e.postData.getDataAsString());

  const dataSheet = activeSheet.getSheetByName('log');
  dataSheet.appendRow([toDateTimeEntry(Date.now()), JSON.stringify(reqParam)]);
  console.log(reqParam)

  switch (reqParam.action) {
    case "checkIn":
      {
        const result = checkIn(reqParam);
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
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

// debug on doPost
function doPostTest() {
  const postData = {
    action: 'checkIn',
    memberId: '3d6v',
    memberName: '横川耕二',
    memberSchool: '大学',
    memberDetail: '青学つくまなラボ',
  }
  const e = {
    postData : Utilities.newBlob(JSON.stringify(postData))
  };
  doPost(e);
}

function checkInTest() {
  checkIn('1')
}
