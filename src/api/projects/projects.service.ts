import prisma from "@shared/config/db-connection";
import { CreateProjectInput } from "./projects.types";
import { ApiError } from "@shared/middlewares/error";
import { fetchRawReadme, parseGithubUrl } from "./projects.utils";
import { StdioNull } from "child_process";

export async function getAllProjects() {
    return await prisma.project.findMany({
        select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            period: true,
            status: true,
            isFeatured: true,
            order: true,
            devStack: true,
            visualStack: true,
            demoUrl: true,
            githubUrl: true,
        },
        orderBy: { order: "asc" },
    });
}

export async function getProjectById(id: number) {
    return await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            period: true,
            status: true,
            isFeatured: true,
            order: true,
            devStack: true,
            visualStack: true,
            demoUrl: true,
            githubUrl: true,
            readmeContent: true,
            syncedAt: true,
        },
    });
}

export async function getProjectBySlug(slug: string) {
    return await prisma.project.findUnique({
        where: { slug },
    });
}

export async function createProject(project: CreateProjectInput) {
    let readmeContent: string | null = null;
    let syncedAt: Date | null = null;

    const repoInfo = parseGithubUrl(project.githubUrl);
    if (repoInfo) {
        readmeContent = await fetchRawReadme(repoInfo.owner, repoInfo.repo);
        syncedAt = new Date();
    } else throw new ApiError(400, "BAD_REQUEST", "유효한 GitHub 저장소 주소가 아닙니다.");

    return await prisma.project.create({
        data: {
            ...project,
            readmeContent,
            syncedAt,
        },
        select: {
            id: true,
            slug: true,
        },
    });
}

export async function editProject(project: CreateProjectInput, id: number) {
    const existing = await prisma.project.findUnique({
        where: { id },
        select: { id: true, githubUrl: true },
    });

    if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "수정할 프로젝트를 찾을 수 없습니다.");
    }


    let readmeContent: string | null = null;
    let syncedAt: Date | null = null;

    const repoInfo = parseGithubUrl(project.githubUrl);
    if (repoInfo) {
        readmeContent = await fetchRawReadme(repoInfo.owner, repoInfo.repo);
        syncedAt = new Date();
    } 

    return await prisma.project.update({
        where: { id },
        data: {
            ...project,
            readmeContent,
            syncedAt,
        },
        select: {
            id: true,
            slug: true,
        },
    });
}

export async function deleteProject(id: number) {
    const existing = await prisma.project.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "삭제할 프로젝트를 찾을 수 없습니다.");
    }

    return await prisma.project.delete({
        where: { id },
        select: {
            id: true,
            slug: true,
        },
    });
}

export async function syncProject(id: number) {
    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, githubUrl: true, slug: true },
    });

    if (!project) {
        throw new ApiError(404, "NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
    }


    const repoInfo = parseGithubUrl(project.githubUrl);
    if (!repoInfo) {
        throw new ApiError(400, "BAD_REQUEST", "유효한 GitHub 저장소 주소가 아닙니다.");
    }

    const readmeContent = await fetchRawReadme(repoInfo.owner, repoInfo.repo);

    return await prisma.project.update({
        where: { id },
        data: {
            readmeContent,
            syncedAt: new Date(),
        },
        select: {
            id: true,
            slug: true,
            syncedAt: true,
        },
    });
}