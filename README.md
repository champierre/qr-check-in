# Member Check-In System

This is a simple member check-in system built using Google Apps Script and Google Sheets. The system allows members to check-in by providing their member ID, name, school, and other details. The check-in data is then stored in a Google Sheet for record-keeping purposes.

## Getting Started

### Prerequisites

install clasp

```cmd
npm install -g @google/clasp
```

install mkcert

for windows
```cmd
choco install mkcert
```

### installation

To get started with this project, you will need to have a Google account and access to Google Sheets. This project uses clasp to manage the Google Apps Script project, so you will also need to have Node.js and npm installed on your computer.

Once you have copied the code, you will need to create a new Google Sheet with the files `Data.csv` and `CheckIn.csv` in the `gas` folder. You can then create a new Google Apps Script project and link it to the Google Sheet using clasp.

use mkcert to create a local CA
```cmd
mkcert -install
```

use mkcert to create a local certificate
```cmd
mkdir cert
cd cert
mkcert localhost 127.0.0.1 ::1
```

install dependencies
```bash
npm install
```


## Usage

start a local server
```bash
npm run start
```

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
