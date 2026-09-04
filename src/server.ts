import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authenticateNextAuthJWT from "./shared/middlewares/jwt-decode";
import {initUploadPath, uploadDir} from "@shared/config/upload-path";
import apiRouter from "./api";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
initUploadPath();

app.use(cors({
  origin: process.env.ORIGIN!.split(","),
}));
app.use(express.json());
app.use(authenticateNextAuthJWT);
app.use('/uploads', express.static(uploadDir));
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`SERVER ONLINE ON PORT: ${PORT}`);
});
