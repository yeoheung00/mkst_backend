import express from 'express'
import { uploadFile } from './upload.controller'
import { upload } from './upload.service';

const uploadRouter = express.Router();
uploadRouter.post('/image', upload.single("file"), uploadFile);

export default uploadRouter;
