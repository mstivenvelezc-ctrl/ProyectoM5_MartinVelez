import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerListRepositoriesTool } from "../../tools/listRepositories.js";

const listForAuthenticatedUser = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { listForAuthenticatedUser },
    }),
}));

describe("list_repositories", () => {
    beforeEach(() => {
        listForAuthenticatedUser.mockReset();
    });

    it("lista los repositorios del usuario autenticado", async () => {
        listForAuthenticatedUser.mockResolvedValue({
            data: [
                { full_name: "octo/hello", private: false, description: "repo público" },
                { full_name: "octo/secreto", private: true, description: null },
            ],
        });

        const { server, getHandler } = createMockServer();
        registerListRepositoriesTool(server);
        const handler = getHandler("list_repositories");

        const result = await handler({ perPage: 30 });

        expect(listForAuthenticatedUser).toHaveBeenCalledWith({ per_page: 30, sort: "updated" });
        expect(result.content[0]?.text).toContain("(2)");
        expect(result.content[0]?.text).toContain("octo/hello (público) — repo público");
        expect(result.content[0]?.text).toContain("octo/secreto (privado)");
    });

    it("informa cuando no hay repositorios", async () => {
        listForAuthenticatedUser.mockResolvedValue({ data: [] });

        const { server, getHandler } = createMockServer();
        registerListRepositoriesTool(server);
        const handler = getHandler("list_repositories");

        const result = await handler({ perPage: 30 });

        expect(result.content[0]?.text).toBe("No se encontraron repositorios.");
    });

    it("devuelve un error legible si la API de GitHub falla", async () => {
        listForAuthenticatedUser.mockRejectedValue({ status: 401, message: "Bad credentials" });

        const { server, getHandler } = createMockServer();
        registerListRepositoriesTool(server);
        const handler = getHandler("list_repositories");

        const result = await handler({ perPage: 30 });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 401");
    });
});
