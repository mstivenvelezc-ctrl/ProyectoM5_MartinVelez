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

    it("pide confirmación vía elicitation y no borra nada si el usuario rechaza", async () => {
        const { server, getHandler, elicitInput } = createMockServer();
        elicitInput.mockResolvedValue({ action: "decline" });
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({ owner: "octo", repo: "hello" });

        expect(elicitInput).toHaveBeenCalledWith(
            expect.objectContaining({ mode: "form" }),
        );
        expect(del).not.toHaveBeenCalled();
        expect(result.content[0]?.text).toContain("cancelada");
    });

    it("rechaza la confirmación si el texto escrito no coincide", async () => {
        const { server, getHandler, elicitInput } = createMockServer();
        elicitInput.mockResolvedValue({
            action: "accept",
            content: { confirmName: "octo/otro-repo" },
        });
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({ owner: "octo", repo: "hello" });

        expect(del).not.toHaveBeenCalled();
        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("no coincide");
    });

    it("borra el repositorio cuando el usuario confirma correctamente", async () => {
        del.mockResolvedValue({});

        const { server, getHandler, elicitInput } = createMockServer();
        elicitInput.mockResolvedValue({
            action: "accept",
            content: { confirmName: "octo/hello" },
        });
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({ owner: "octo", repo: "hello" });

        expect(del).toHaveBeenCalledWith({ owner: "octo", repo: "hello" });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("eliminado permanentemente");
    });

    it("devuelve un error legible si la API de GitHub falla", async () => {
        del.mockRejectedValue({ status: 403, message: "Forbidden" });

        const { server, getHandler, elicitInput } = createMockServer();
        elicitInput.mockResolvedValue({
            action: "accept",
            content: { confirmName: "octo/hello" },
        });
        registerDeleteRepositoryTool(server);
        const handler = getHandler("delete_repository");

        const result = await handler({ owner: "octo", repo: "hello" });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 403");
    });
});
