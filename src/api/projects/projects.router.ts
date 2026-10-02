import express from "express";
import { getProjects, getProject, createProject, editProject, deleteProject, syncProject } from "./projects.controller";
import { adminOnly } from "@shared/middlewares/auth";
import { authenticatedHandler } from "@shared/http/handler";

const projectsRouter = express.Router();

projectsRouter.get("/", getProjects);
projectsRouter.get("/:slug", getProject);
projectsRouter.post("/", adminOnly, authenticatedHandler(createProject));
projectsRouter.patch("/:id", adminOnly, authenticatedHandler(editProject));
projectsRouter.delete("/:id", adminOnly, authenticatedHandler(deleteProject));
projectsRouter.get("/:id/sync", adminOnly, authenticatedHandler(syncProject));

export default projectsRouter;
