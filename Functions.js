const { google } = require("googleapis");
const { ModelTestData, ModelMetaData } = require("./Connection");
const crypto = require("crypto");
const fs = require("fs");
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
    const range = "MailerCloud!A1:H500";

    const response = await sheet.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    //getting every rows in array

    const rows = response.data.values;
    const dataInDB = await ModelTestData.find();
    const CheckingMetaData = await ModelMetaData.find();

    if (!dataInDB || (dataInDB.length <= 0 && CheckingMetaData.length <= 0)) {
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

        if (i === rows.length - 1) {
          console.log(true);
          const MetaDataModelInstance = new ModelMetaData({
            LastFetchedRowHashValue: rowHash,
          });

          MetaDataModelInstance.save();
          console.log("Last fetched row hash value is created....");
        }
      }
    }

    //Getting only updated data from the sheet
    else {
      const FindResult = await ModelMetaData.find();

      let FetchingIndex;

      for (let i = 0; i <= rows.length - 1; i++) {
        const rowHash = await createHash(rows[i]);
        if (rowHash === FindResult[0].LastFetchedRowHashValue) {
          FetchingIndex = i + 1;
        }
      }

      for (let i = FetchingIndex; i <= rows.length - 1; i++) {
        const rowHash = await createHash(rows[i]);

        const DocumentInstance = new ModelTestData({
          FirstName: rows[i][0],
          LastName: rows[i][1],
          Email: rows[i][3],
          HashValue: rowHash,
        });

        DocumentInstance.save();

        await ModelMetaData.updateOne({ LastFetchedRowHashValue: rowHash });
        console.log("Last fetched row hash value is updated....");
      }
    }
  } catch (error) {
    console.log("Unable to fetch data", error);
  }
}

async function fetchDataFromDBAndSendToAPI() {
  var counter = 0;
  //fetching 100 data from db
  const dataInDB = await ModelTestData.find().limit(100);

  let length = dataInDB.length;

  if (length <= 100) {
    for (let i = 0; i <= length - 1; i++) {
      await addingSubscribers(dataInDB[i]);

      await ModelTestData.deleteOne({ _id: dataInDB[i]._id });
    }
  } else {
    for (let i = 0; i <= 99; i++) {
      await addingSubscribers(dataInDB[i]);
      await ModelTestData.deleteOne({ _id: dataInDB[i]._id });
    }
  }
}

module.exports = {
  gettingSheetDataAndStoringInDB,
  fetchDataFromDBAndSendToAPI,
};
