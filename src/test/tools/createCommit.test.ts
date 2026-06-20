import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerCreateCommitTool } from "../../tools/createCommit.js";

const getContent = vi.fn();
const createOrUpdateFileContents = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        repos: { getContent, createOrUpdateFileContents },
    }),
}));

describe("create_commit", () => {
    beforeEach(() => {
        getContent.mockReset();
        createOrUpdateFileContents.mockReset();
    });

    it("crea un archivo nuevo cuando todavía no existe (404)", async () => {
        getContent.mockRejectedValue({ status: 404, message: "Not Found" });
        createOrUpdateFileContents.mockResolvedValue({
            data: {
                commit: { sha: "sha-nuevo" },
                content: { html_url: "https://github.com/octo/hello/blob/main/a.txt" },
            },
        });

        const { server, getHandler } = createMockServer();
        registerCreateCommitTool(server);
        const handler = getHandler("create_commit");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            path: "a.txt",
            content: "hola",
            message: "agrega a.txt",
        });

        expect(createOrUpdateFileContents).toHaveBeenCalledWith(
            expect.objectContaining({
                owner: "octo",
                repo: "hello",
                path: "a.txt",
                message: "agrega a.txt",
                content: Buffer.from("hola", "utf-8").toString("base64"),
            }),
        );
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("Archivo creado");
    });

    it("actualiza el archivo existente reutilizando su sha", async () => {
        getContent.mockResolvedValue({ data: { sha: "sha-viejo" } });
        createOrUpdateFileContents.mockResolvedValue({
            data: {
                commit: { sha: "sha-actualizado" },
                content: { html_url: "https://github.com/octo/hello/blob/main/a.txt" },
            },
        });

        const { server, getHandler } = createMockServer();
        registerCreateCommitTool(server);
        const handler = getHandler("create_commit");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            path: "a.txt",
            content: "nuevo contenido",
            message: "actualiza a.txt",
            branch: "feature/x",
        });

        expect(createOrUpdateFileContents).toHaveBeenCalledWith(
            expect.objectContaining({ sha: "sha-viejo", branch: "feature/x" }),
        );
        expect(result.content[0]?.text).toContain("Archivo actualizado");
    });

    it("propaga errores que no sean 404 al leer el contenido existente", async () => {
        getContent.mockRejectedValue({ status: 500, message: "Server Error" });

        const { server, getHandler } = createMockServer();
        registerCreateCommitTool(server);
        const handler = getHandler("create_commit");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            path: "a.txt",
            content: "hola",
            message: "agrega a.txt",
        });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 500");
        expect(createOrUpdateFileContents).not.toHaveBeenCalled();
    });
});
