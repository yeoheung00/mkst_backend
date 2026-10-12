import express from 'express'
import { uploadFile } from './upload.controller'
import { upload } from './upload.service';
import { authenticateToken, requireRole } from 'src/shared/middlewares/auth';

const uploadRouter = express.Router();
uploadRouter.post('/image', authenticateToken, requireRole(["ADMIN"]), upload.single("file"), uploadFile);

export default uploadRouter;
