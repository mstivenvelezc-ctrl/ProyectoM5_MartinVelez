import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerMergeBranchTool } from "../../tools/mergeBranch.js";

const merge = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { merge },
    }),
}));

describe("merge_branch", () => {
    beforeEach(() => {
        merge.mockReset();
    });

    it("fusiona head dentro de base", async () => {
        merge.mockResolvedValue({
            data: { sha: "merge-sha", html_url: "https://github.com/octo/hello/commit/merge-sha" },
        });

        const { server, getHandler } = createMockServer();
        registerMergeBranchTool(server);
        const handler = getHandler("merge_branch");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            head: "feature/x",
            base: "main",
        });

        expect(merge).toHaveBeenCalledWith({ owner: "octo", repo: "hello", base: "main", head: "feature/x" });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("'feature/x' → 'main'");
    });

    it("informa cuando la rama ya está al día (sin commit nuevo)", async () => {
        merge.mockResolvedValue({ data: null });

        const { server, getHandler } = createMockServer();
        registerMergeBranchTool(server);
        const handler = getHandler("merge_branch");

        const result = await handler({ owner: "octo", repo: "hello", head: "feature/x", base: "main" });

        expect(result.content[0]?.text).toContain("ya estaba al día");
    });

    it("devuelve un error legible si hay conflictos de merge", async () => {
        merge.mockRejectedValue({ status: 409, message: "Merge conflict" });

        const { server, getHandler } = createMockServer();
        registerMergeBranchTool(server);
        const handler = getHandler("merge_branch");

        const result = await handler({ owner: "octo", repo: "hello", head: "feature/x", base: "main" });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 409");
    });
});
