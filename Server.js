const {
  gettingSheetDataAndStoringInDB,
  fetchDataFromDBAndSendToAPI,
} = require("./Functions");

const cron = require("node-cron");

async function main() {

  //evoking function every minutes
  cron.schedule("* * * * *", async () => {
    console.log("Fetching documents...");
    await gettingSheetDataAndStoringInDB();
    await fetchDataFromDBAndSendToAPI();
  });

  process.on("SIGINT", function () {
    console.log("Caught interrupt signal, closing database connection...");
    mongoose.connection.close(function () {
      console.log("Database connection closed.");
      process.exit(0);
    });
  });
}

main();
