import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerCreateBranchTool } from "../../tools/createBranch.js";

const getRef = vi.fn();
const createRef = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        git: { getRef, createRef },
    }),
}));

describe("create_branch", () => {
    beforeEach(() => {
        getRef.mockReset();
        createRef.mockReset();
    });

    it("crea la rama a partir del SHA de la rama base", async () => {
        getRef.mockResolvedValue({ data: { object: { sha: "abc123" } } });
        createRef.mockResolvedValue({});

        const { server, getHandler } = createMockServer();
        registerCreateBranchTool(server);
        const handler = getHandler("create_branch");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            branch: "feature/x",
            base: "main",
        });

        expect(getRef).toHaveBeenCalledWith({
            owner: "octo",
            repo: "hello",
            ref: "heads/main",
        });
        expect(createRef).toHaveBeenCalledWith({
            owner: "octo",
            repo: "hello",
            ref: "refs/heads/feature/x",
            sha: "abc123",
        });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("Rama 'feature/x' creada");
        expect(result.content[0]?.text).toContain("abc123");
    });

    it("devuelve un error legible si la rama base no existe", async () => {
        getRef.mockRejectedValue({ status: 404, message: "Not Found" });

        const { server, getHandler } = createMockServer();
        registerCreateBranchTool(server);
        const handler = getHandler("create_branch");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            branch: "feature/x",
            base: "no-existe",
        });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 404");
        expect(createRef).not.toHaveBeenCalled();
    });
});
