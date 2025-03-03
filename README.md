# Member Check-In System

This is a simple member check-in system built using Google Apps Script and Google Sheets. The system allows members to check-in by providing their member ID, name, school, and other details. The check-in data is then stored in a Google Sheet for record-keeping purposes.

## Getting Started

### Setting Up the Google Sheet

Add the Google Sheets `member-list` and `member-log` to your Google Drive with the scripts using clasp.
Then, deploy the scripts as a web app and get the URL of the web app.

### Open the Check-In Page

1. Replace `findUrl` in `open.html` with the URL of the Google Apps Script of the `member-list`.
2. Replace `checkInUrl` in `open.html` with the URL of the Google Apps Script of the `member-log`.
3. Open `open.html` in your browser and click the link to open the check-in page.


## Mechanism

### Check-In

To use the member check-in system, members can send a `POST` request to the URL of the Google Apps Script project with the following parameters:

- `action`: The action to perform (e.g. `checkIn`)
- `memberId`: The member's ID
- `memberName`: The member's name
- `memberSchool`: The member's school
- `memberDetail`: Other details about the member (optional)

The system will then store the check-in data in the `CheckIn` tab of the Google Sheet and return a JSON response with the member's ID and timestamp.

### Retrieving Member Data by QR Code

In addition to the check-in feature, the system now supports retrieving member data by QR code. Members can generate a QR code containing their member ID and scan it at the check-in kiosk to automatically check-in.

To use this feature, members can generate a QR code using any QR code generator and print it out or save it to their phone. When they arrive at the check-in kiosk, they can scan the QR code using a QR code scanner app on a QR code scanner built into the kiosk.

The system will then automatically check-in the member and store the check-in data in the `CheckIn` tab of the Google Sheet.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Acknowledgments

- This project was developed by the need for a simple member check-in system for Aogaku Tukumana Lab.

