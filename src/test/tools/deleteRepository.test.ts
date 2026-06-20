import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerDeleteRepositoryTool } from "../../tools/deleteRepository.js";

const del = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { delete: del },
    }),
}));

describe("delete_repository", () => {
    beforeEach(() => {
        del.mockReset();
    });

    it("pide confirmación y no borra nada si confirm es false", async () => {
        const { server, getHandler } = createMockServer();
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({ owner: "octo", repo: "hello", confirm: false });

        expect(del).not.toHaveBeenCalled();
        expect(result.content[0]?.text).toContain("REQUIERE CONFIRMACIÓN");
        expect(result.content[0]?.text).toContain("octo/hello");
    });

    it("rechaza la confirmación si confirmName no coincide", async () => {
        const { server, getHandler } = createMockServer();
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            confirm: true,
            confirmName: "octo/otro-repo",
        });

        expect(del).not.toHaveBeenCalled();
        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("no coincide");
    });

    it("borra el repositorio cuando confirm y confirmName son correctos", async () => {
        del.mockResolvedValue({});

        const { server, getHandler } = createMockServer();
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            confirm: true,
            confirmName: "octo/hello",
        });

        expect(del).toHaveBeenCalledWith({ owner: "octo", repo: "hello" });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("eliminado permanentemente");
    });

    it("devuelve un error legible si la API de GitHub falla", async () => {
        del.mockRejectedValue({ status: 403, message: "Forbidden" });

        const { server, getHandler } = createMockServer();
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            confirm: true,
            confirmName: "octo/hello",
        });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 403");
    });
});
