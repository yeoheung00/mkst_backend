import { ApiError } from "@shared/middlewares/error";

export interface ParsedGithubUrl {
    owner: string;
    repo: string;
}

/**
 * GitHub 저장소 URL에서 owner와 repo 추출
 * 지원 형식:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - http://github.com/owner/repo/
 */
export function parseGithubUrl(url: string): ParsedGithubUrl | null {
    if (!url) return null;

    const trimmed = url.trim();
    const match = trimmed.match(
        /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/
    );

    if (!match) return null;

    return {
        owner: match[1],
        repo: match[2],
    };
}

/**
 * raw.githubusercontent.com에서 main 브랜치 README.md 수신 및 상대 경로 보정
 */
export async function fetchRawReadme(
    owner: string,
    repo: string
): Promise<string | null> {
    const branch = "main";
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6초 타임아웃

    try {
        const response = await fetch(rawUrl, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Personal-Portfolio-Crawler",
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 404) {
                return null; // README.md가 없는 경우 null 반환
            }
            throw new ApiError(
                response.status,
                "FETCH_FAILED",
                `GitHub README 수신 실패 (상태 코드: ${response.status})`
            );
        }

        const rawMarkdown = await response.text();

        // 상대 경로 치환을 위한 기본 URL
        const rawAssetBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
        const githubLinkBase = `https://github.com/${owner}/${repo}/blob/${branch}`;

        return rawMarkdown
            // 1. 상대 경로 이미지 치환: ![alt](./docs/preview.png) 또는 ![alt](preview.png) -> Raw URL
            .replace(
                /!\[(.*?)\]\(((?!https?:\/\/\vert{}\/\/)(?:\.\/)?(.*?))\)/g,
                `![$1](${rawAssetBase}/$2)`
            )
            // 2. 상대 경로 파일/페이지 링크 치환: [link](./docs/spec.md) -> GitHub Blob URL
            .replace(
                /(?<!!)\[(.*?)\]\(((?!https?:\/\/\vert{}\/\/\vert{}#)(?:\.\/)?(.*?))\)/g,
                `[$1](${githubLinkBase}/$2)`
            );
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
            throw new ApiError(504, "TIMEOUT", "GitHub README 요청 시간이 초과되었습니다.");
        }

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(
            500,
            "INTERNAL_SERVER_ERROR",
            `README 수집 중 오류 발생: ${error.message}`
        );
    }
}