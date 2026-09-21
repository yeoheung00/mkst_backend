import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import {initUploadPath, uploadDir} from "@shared/config/upload-path";
import apiRouter from "./api";

const app = express();
const PORT = process.env.PORT || 8080;
initUploadPath();

const allowedOrigins = process.env.ORIGIN!.split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`SERVER ONLINE ON PORT: ${PORT}`);
});
