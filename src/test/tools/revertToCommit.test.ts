import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerRevertToCommitTool } from "../../tools/revertToCommit.js";

const get = vi.fn();
const updateRef = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { get },
        git: { updateRef },
    }),
}));

describe("revert_to_commit", () => {
    beforeEach(() => {
        get.mockReset();
        updateRef.mockReset();
    });

    it("pide confirmación y no mueve nada si confirm es false", async () => {
        const { server, getHandler } = createMockServer();
        registerRevertToCommitTool(server);
        const handler = getHandler("revert_to_commit");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            sha: "abc1234",
            branch: "feature/x",
            confirm: false,
        });

        expect(updateRef).not.toHaveBeenCalled();
        expect(get).not.toHaveBeenCalled();
        expect(result.content[0]?.text).toContain("REQUIERE CONFIRMACIÓN");
        expect(result.content[0]?.text).toContain("feature/x");
    });

    it("usa la rama por defecto del repo cuando no se indica branch", async () => {
        get.mockResolvedValue({ data: { default_branch: "main" } });

        const { server, getHandler } = createMockServer();
        registerRevertToCommitTool(server);
        const handler = getHandler("revert_to_commit");

        const result = await handler({ owner: "octo", repo: "hello", sha: "abc1234", confirm: false });

        expect(get).toHaveBeenCalledWith({ owner: "octo", repo: "hello" });
        expect(result.content[0]?.text).toContain('rama "main"');
    });

    it("mueve la rama al sha indicado con force cuando confirm es true", async () => {
        updateRef.mockResolvedValue({ data: { object: { sha: "abc1234" } } });

        const { server, getHandler } = createMockServer();
        registerRevertToCommitTool(server);
        const handler = getHandler("revert_to_commit");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            sha: "abc1234",
            branch: "feature/x",
            confirm: true,
        });

        expect(updateRef).toHaveBeenCalledWith({
            owner: "octo",
            repo: "hello",
            ref: "heads/feature/x",
            sha: "abc1234",
            force: true,
        });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("movida al commit abc1234");
    });

    it("devuelve un error legible si el sha no existe", async () => {
        updateRef.mockRejectedValue({ status: 422, message: "Reference update failed" });

        const { server, getHandler } = createMockServer();
        registerRevertToCommitTool(server);
        const handler = getHandler("revert_to_commit");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            sha: "abc1234",
            branch: "feature/x",
            confirm: true,
        });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 422");
    });
});
