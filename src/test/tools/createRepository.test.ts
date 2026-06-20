import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerCreateRepositoryTool } from "../../tools/createRepository.js";

const createForAuthenticatedUser = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { createForAuthenticatedUser },
    }),
}));

describe("create_repository", () => {
    beforeEach(() => {
        createForAuthenticatedUser.mockReset();
    });

    it("crea el repositorio con los datos indicados", async () => {
        createForAuthenticatedUser.mockResolvedValue({
            data: {
                full_name: "octo/nuevo-repo",
                private: true,
                html_url: "https://github.com/octo/nuevo-repo",
            },
        });

        const { server, getHandler } = createMockServer();
        registerCreateRepositoryTool(server);
        const handler = getHandler("create_repository");

        const result = await handler({
            name: "nuevo-repo",
            description: "repo de prueba",
            isPrivate: true,
        });

        expect(createForAuthenticatedUser).toHaveBeenCalledWith({
            name: "nuevo-repo",
            private: true,
            description: "repo de prueba",
        });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("octo/nuevo-repo");
        expect(result.content[0]?.text).toContain("Privado: sí");
    });

    it("devuelve un error legible si la creación falla", async () => {
        createForAuthenticatedUser.mockRejectedValue({ status: 422, message: "name already exists" });

        const { server, getHandler } = createMockServer();
        registerCreateRepositoryTool(server);
        const handler = getHandler("create_repository");

        const result = await handler({ name: "repetido", isPrivate: false });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 422");
    });
});
