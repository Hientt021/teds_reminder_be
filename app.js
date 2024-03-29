import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import auth from "./routes/auth.js";
import tasks from "./routes/tasks.js";
import middlewareController from "./controllers/middlewareController.js";

dotenv.config();
const app = express();

const port = process.env.PORT || 5000;
const endPoint = "/api/v1";
const uri = process.env.MONGOOSE_DB;
mongoose.connect(uri);

app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(endPoint + "/auth", auth);
app.use(endPoint, middlewareController.verifyToken, tasks);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
