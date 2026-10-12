import express from "express";
import { getProjects, getProject, createProject, editProject, deleteProject, syncProject } from "./projects.controller";
import { authenticateToken, requireRole } from "@shared/middlewares/auth";
import { authenticatedHandler } from "@shared/http/handler";

const projectsRouter = express.Router();

projectsRouter.get("/", getProjects);
projectsRouter.get("/:slug", getProject);
projectsRouter.post("/", authenticateToken, requireRole(["ADMIN"]), authenticatedHandler(createProject));
projectsRouter.patch("/:id", authenticateToken, requireRole(["ADMIN"]), authenticatedHandler(editProject));
projectsRouter.delete("/:id", authenticateToken, requireRole(["ADMIN"]), authenticatedHandler(deleteProject));
projectsRouter.patch("/:id/sync", authenticateToken, requireRole(["ADMIN"]), authenticatedHandler(syncProject));

export default projectsRouter;
