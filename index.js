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
  exercises: [{ description: String, duration: Number, date: Date }],
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

app.post("/api/users/:_id/exercises", async (req, res) => {
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = req.body.date;

  if (date === undefined) {
    date = new Date();
  }
  let user = await User.findById(req.params._id);
  user.exercises.push({ description, duration, date });
  await user.save();

  return res.json({
    username: user.username,
    description,
    duration,
    date: date.toDateString(),
    _id: user._id,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;

  let pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.params._id),
        $and: [
          from ? { "exercises.date": { $gte: from } } : {},
          to ? { "exercises.date": { $lte: to } } : {},
        ],
      },
    },
    {
      $project: {
        username: 1,
        count: { $size: "$exercises" },
        log: {
          $slice: ["$exercises", parseInt(limit)],
        },
      },
    },
    { $unset: "log._id" },
  ];

  let user = await User.aggregate(pipeline);
  user[0].log.forEach(
    (entry) => (entry.date = new Date(entry.date).toDateString())
  );
  return res.json(user[0]);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
