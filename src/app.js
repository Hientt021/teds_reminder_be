const express = require("express");
const path = require("path");
const session = require("express-session");
const users = require("./server/routes/users.js");
const tasks = require("./server/routes/tasks.js");

const { connectDataBase } = require("./mongo/index.js");
const app = express();
const port = 5000;
const endPoint = "/api/v1";
connectDataBase();

app.get("/", (req, res) => res.send("New Express on Vercel"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(endPoint, users);
app.use(endPoint, tasks);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});