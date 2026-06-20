import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerCreateIssueTool } from "../../tools/createIssue.js";

const create = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        issues: { create },
    }),
}));

describe("create_issue", () => {
    beforeEach(() => {
        create.mockReset();
    });

    it("crea el issue y devuelve su número y URL", async () => {
        create.mockResolvedValue({
            data: { number: 7, title: "Bug raro", html_url: "https://github.com/octo/hello/issues/7" },
        });

        const { server, getHandler } = createMockServer();
        registerCreateIssueTool(server);
        const handler = getHandler("create_issue");

        const result = await handler({
            owner: "octo",
            repo: "hello",
            title: "Bug raro",
            body: "pasos para reproducir",
        });

        expect(create).toHaveBeenCalledWith({
            owner: "octo",
            repo: "hello",
            title: "Bug raro",
            body: "pasos para reproducir",
        });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("Issue #7 creado");
    });

    it("omite el body cuando no se proporciona", async () => {
        create.mockResolvedValue({
            data: { number: 1, title: "Sin body", html_url: "https://github.com/octo/hello/issues/1" },
        });

        const { server, getHandler } = createMockServer();
        registerCreateIssueTool(server);
        const handler = getHandler("create_issue");

        await handler({ owner: "octo", repo: "hello", title: "Sin body" });

        expect(create).toHaveBeenCalledWith({ owner: "octo", repo: "hello", title: "Sin body" });
    });

    it("devuelve un error legible si la API de GitHub falla", async () => {
        create.mockRejectedValue({ status: 422, message: "Validation Failed" });

        const { server, getHandler } = createMockServer();
        registerCreateIssueTool(server);
        const handler = getHandler("create_issue");

        const result = await handler({ owner: "octo", repo: "hello", title: "x" });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 422");
    });
});
