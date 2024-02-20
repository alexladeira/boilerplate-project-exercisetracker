const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const userSchema = new mongoose.Schema({
  username: String,
  exercises: [{ description: String, duration: String, date: Date }],
});
const User = mongoose.model("User", userSchema);

app
  .route("/api/users")
  .get(async (req, res) => {
    const result = await User.find({}, "username _id");
    return res.json(
      result.map((user) => ({ _id: user._id, username: user.username }))
    );
  })
  .post(async (req, res) => {
    const user = new User({ username: req.body.username });
    await user.save();
    return res.json({ _id: user._id, username: user.username });
  });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
