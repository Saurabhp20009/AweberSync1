var mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/Saurabh");

const Schema = mongoose.Schema;

const mySchema = new Schema([
  {
    FirstName: String,
    LastName: String,
    Email: String,
    HashValue: String,
  },
]);

const ModelTestData = mongoose.model("TestData", mySchema);

module.exports = ModelTestData;
