import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerGetRepositoryTool } from "../../tools/getRepository.js";

const get = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { get },
    }),
}));

describe("get_repository", () => {
    beforeEach(() => {
        get.mockReset();
    });

    it("devuelve la información principal del repositorio", async () => {
        get.mockResolvedValue({
            data: {
                full_name: "octo/hello",
                description: "repo de ejemplo",
                private: false,
                language: "TypeScript",
                stargazers_count: 10,
                forks_count: 2,
                open_issues_count: 1,
                default_branch: "main",
                html_url: "https://github.com/octo/hello",
            },
        });

        const { server, getHandler } = createMockServer();
        registerGetRepositoryTool(server);
        const handler = getHandler("get_repository");

        const result = await handler({ owner: "octo", repo: "hello" });

        expect(get).toHaveBeenCalledWith({ owner: "octo", repo: "hello" });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("octo/hello");
        expect(result.content[0]?.text).toContain("TypeScript");
    });

    it("devuelve un error legible si el repositorio no existe", async () => {
        get.mockRejectedValue({ status: 404, message: "Not Found" });

        const { server, getHandler } = createMockServer();
        registerGetRepositoryTool(server);
        const handler = getHandler("get_repository");

        const result = await handler({ owner: "octo", repo: "no-existe" });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 404");
    });
});
