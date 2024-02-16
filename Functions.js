const { google } = require("googleapis");
const ModelTestData = require("./Connection");
const crypto = require("crypto");
const fs= require('fs')
const { addingSubscribers } = require("./AweberFunctions");

//Authentication
const auth = new google.auth.GoogleAuth({
  keyFile: "my-project-6051-412211-c4701a7e7602.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const clientId = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const clientSecret = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const redirectUri = "https://connectsyncdata.com/callback/aweber";

//function for creating hash for every row
async function createHash(row) {
  const rowDataString = JSON.stringify(row);
  const hash = crypto.createHash("sha256");
  hash.update(rowDataString);
  return hash.digest("hex");
}

async function gettingSheetDataAndStoringInDB() {
  const sheet = google.sheets({ version: "v4", auth });

  try {
    const spreadsheetId = "1MJxJjA_uhTH2D3WHp6wdNhBFmARURIANH_lowy9wbro";
    const range = "MailerCloud!A1:H100";

    const response = await sheet.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    //getting every rows in array

    const rows = response.data.values;
    console.log(rows)
    const dataInDB = await ModelTestData.find();

    if (!dataInDB || dataInDB.length <= 0) {
      //looping for accessing every elements of rows
      for (let i = 1; i <= rows.length - 1; i++) {
        const rowHash = await createHash(rows[i]);

        const DocumentInstance = new ModelTestData({
          FirstName: rows[i][0],
          LastName: rows[i][1],
          Email: rows[i][3],
          HashValue: rowHash,
        });

        DocumentInstance.save();
      }
    }

    //Getting only updated data from the sheet
    else {
      for (let i = 1; i <= rows.length - 1; i++) {
        const rowHash = await createHash(rows[i]);

        const checkingRecordInDB = await ModelTestData.find({
          HashValue: rowHash,
        });

        if (checkingRecordInDB.length <= 0) {
          const DocumentInstance = new ModelTestData({
            FirstName: rows[i][0],
            LastName: rows[i][1],
            Email: rows[i][3],
            HashValue: rowHash,
          });

          DocumentInstance.save();
        }
      }
    }
  } catch (error) {
    console.log("Unable to fetch data", error);
  }
}

async function fetchDataFromDBAndSendToAPI() {
  let fileReadResult;
  try {
    fileReadResult = fs.readFileSync("MetaData.json", "utf8");
  } catch (err) {
    console.error("Error reading file:", err);
  }

  //fetching data containing values
  const dataInDB = await ModelTestData.find({
    $and: [
      { FirstName: { $exists: true } },
      { LastName: { $exists: true } },
      { Email: { $exists: true } },
      { HashValue: { $exists: true } },
      {
        $nor: [
          { FirstName: null },
          { LastName: null },
          { Email: null },
          { HashValue: null },
        ],
      },
    ],
  });

  let length = dataInDB.length;

  if (length <= 100) {
    for (let i = 0; i <= length - 1; i++) {
      
    
      const APIResult = await addingSubscribers(dataInDB[i]);     
      console.log(APIResult)
      if (APIResult===201) {
        const date = new Date();

        fileReadResult.LastTimeFetch = date;
        fileReadResult.LastIDFetch = dataInDB[i]._id;
        fileReadResult.LastHashValue = dataInDB[i].HashValue;

        fs.writeFile("MetaData.json", fileReadResult, "utf8", (err) => {
          if (err) {
            console.error("Error writing to file:", err);
            return;
          }
          console.log("MetaData file content modified successfully.");
        });

        await ModelTestData.updateOne(
          { _id: dataInDB[i]._id },
          { $set: { HashValue: dataInDB[i].HashValue } }
        );
      }
    }
  } else {
    for (let i = 0; i <= 99; i++) {
      const APIResult = await addingSubscribers(dataInDB[i]);

      if (APIResult===201) {

        const date = new Date();

        fileReadResult.LastTimeFetch = date;
        fileReadResult.LastIDFetch = dataInDB[i]._id;
        fileReadResult.LastHashValue = dataInDB[i].HashValue;

        fs.writeFile("MetaData.json", fileReadResult, "utf8", (err) => {
          if (err) {
            console.error("Error writing to file:", err);
            return;
          }
          console.log("MetaData file content modified successfully.");
        });
    
         

        await ModelTestData.updateOne(
          { _id: dataInDB[i]._id },
          { $set: { HashValue: dataInDB[i].HashValue } }
        );
      }
    }
  }
}

fetchDataFromDBAndSendToAPI();

module.exports = {
  gettingSheetDataAndStoringInDB,
  fetchDataFromDBAndSendToAPI,
};
