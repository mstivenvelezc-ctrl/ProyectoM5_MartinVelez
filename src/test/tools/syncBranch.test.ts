import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerSyncBranchTool } from "../../tools/syncBranch.js";

const merge = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { merge },
    }),
}));

describe("sync_branch", () => {
    beforeEach(() => {
        merge.mockReset();
    });

    it("fusiona base dentro de branch (head/base invertidos respecto a merge_branch)", async () => {
        merge.mockResolvedValue({
            data: { sha: "merge-sha", html_url: "https://github.com/octo/hello/commit/merge-sha" },
        });

        const { server, getHandler } = createMockServer();
        registerSyncBranchTool(server);
        const handler = getHandler("sync_branch");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            branch: "feature/x",
            base: "main",
        });

        expect(merge).toHaveBeenCalledWith({ owner: "octo", repo: "hello", base: "feature/x", head: "main" });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("'feature/x' actualizada");
    });

    it("informa cuando la rama ya está al día (sin commit nuevo)", async () => {
        merge.mockResolvedValue({ data: null });

        const { server, getHandler } = createMockServer();
        registerSyncBranchTool(server);
        const handler = getHandler("sync_branch");

        const result = await handler({ owner: "octo", repo: "hello", branch: "feature/x", base: "main" });

        expect(result.content[0]?.text).toContain("ya está al día");
    });

    it("devuelve un error legible si hay conflictos de merge", async () => {
        merge.mockRejectedValue({ status: 409, message: "Merge conflict" });

        const { server, getHandler } = createMockServer();
        registerSyncBranchTool(server);
        const handler = getHandler("sync_branch");

        const result = await handler({ owner: "octo", repo: "hello", branch: "feature/x", base: "main" });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 409");
    });
});
