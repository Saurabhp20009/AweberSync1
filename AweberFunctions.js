const ClientOAuth2 = require("client-oauth2");
const readline = require("readline");
const OAUTH_URL = "https://auth.aweber.com/oauth2";
const TOKEN_URL = "https://auth.aweber.com/oauth2/token";
const axios = require("axios");
const fs = require("fs");
const { error } = require("console");

const scopes = [
  "account.read",
  "list.read",
  "list.write",
  "subscriber.read",
  "subscriber.write",
  "email.read",
  "email.write",
  "subscriber.read-extended",
  "landing-page.read",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clientId = "zoL6mwfjdAiMsF8wVRVWVpAZ40S0H0Pt";
const clientSecret = "F1HeE25IpnwU5WoGWm3uMEK7ji6A0SO2";
const state = "Undefined";

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

const aweberAuth = new ClientOAuth2({
  clientId,
  clientSecret,
  accessTokenUri: TOKEN_URL,
  authorizationUri: `${OAUTH_URL}/authorize`,
  redirectUri: "https://connectsyncdata.com/callback/aweber",
  scopes,
});

async function buildAuthorizationURL() {
  const authorizationUrl = await aweberAuth.code.getUri({ state });
  console.log(authorizationUrl);
}

async function getAccessToken() {
  await buildAuthorizationURL();

  const authorizationResponse = await question(
    "Login and paste the returned URL here:"
  );

  console.log(authorizationResponse);
  const user = await aweberAuth.code.getToken(authorizationResponse);
  const data = {
    access_token: user.data.access_token,
    refresh_token: user.data.refresh_token,
  };

  const fileData = JSON.stringify(data, null, 2);

  fs.writeFileSync("data.json", fileData);
  console.log("JSON file created successfully");

  return user;
}

async function addingSubscribers(data) {
  let APIResult;
  let fileReadResult;
  try {
    fs.accessSync("data.json", fs.constants.F_OK);
  } catch (err) {
    console.error("File does not exist, creating...");
    // Create the file
    try {
      await getAccessToken();
    } catch (err) {
      console.error("Error creating file:", err);
    }
  }
  // Read the file content
  try {
    fileReadResult = fs.readFileSync("data.json", "utf8");
  } catch (err) {
    console.error("Error reading file:", err);
  }

  const fileJSONData = JSON.parse(fileReadResult);

  const accessToken = fileJSONData.access_token;

  //please specify the list

  const apiUrl =
    "https://api.aweber.com/1.0/accounts/1756373/lists/6550209/subscribers";
   
 
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AWeber-Node-code-sample/1.0",
    Authorization: `Bearer ${accessToken}`,
  };
  const body = JSON.stringify({
    name: data.FirstName + data.LastName,
    email: data.Email,
  });

  APIResult = fetch(apiUrl, {
    headers: headers,
    method: "POST",
    body: body,
  }).then(function (response,error) {
    if (response.status === 201) {
      console.log("Subscriber created");
    
    }
    return response.status
  });

  return APIResult;
}

module.exports = { addingSubscribers };
