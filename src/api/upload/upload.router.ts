import express from 'express'
import { uploadFile } from './upload.controller'
import { upload } from './upload.service';
import { requireAuth } from '@shared/middlewares/auth';

const uploadRouter = express.Router();
uploadRouter.post('/image', requireAuth, upload.single("file"), uploadFile);

export default uploadRouter;
