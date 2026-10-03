
import * as Service from "./projects.service";
import { Request, Response } from "express";
import { CreateProjectInput } from "./projects.types";
import { AuthenticatedRequest } from "@shared/types/auth";

export async function getProjects(req: Request, res: Response) {
    const projects = await Service.getAllProjects();
    return res.status(200).json(projects);
}

export async function getProject(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const project = await Service.getProjectBySlug(slug);
    if (!project) return res.status(404).json({ error: "프로젝트를 가져오는 데 실패했습니다." });
    return res.status(200).json(project);
}

export async function createProject(req: AuthenticatedRequest, res: Response) {
    if (!req.body) return res.status(400).json({ error: "요청 본문이 필요합니다." });
    const project = req.body as CreateProjectInput;
    const result = await Service.createProject(project);
    return res.status(201).json(result);
}

export async function editProject(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.id as string);
    if (!req.body) return res.status(400).json({ error: "요청 본문이 필요합니다." });
    const project = req.body as CreateProjectInput;
    const result = await Service.editProject(project, id);
    return res.status(200).json(result);
}

export async function deleteProject(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.id as string);
    const result = await Service.deleteProject(id);
    return res.status(200).json(result);
}

export async function syncProject(req: AuthenticatedRequest, res: Response) {
    console.log("syncProject called");
    const id = parseInt(req.params.id as string);
    const result = await Service.syncProject(id);
    return res.status(200).json(result);
}