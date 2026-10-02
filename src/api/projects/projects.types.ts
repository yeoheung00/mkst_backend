export interface CreateProjectInput {
    slug: string;
    title: string;
    summary: string;
    period: string;
    status: string;
    isFeatured: boolean;
    order: number;
    devStack: string[];
    visualStack: string[];
    demoUrl?: string;
    githubUrl: string;
}