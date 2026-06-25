import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerDeleteIssueTool } from "../../tools/deletIssue.js";

const get = vi.fn();
const graphql = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        issues: { get },
        graphql,
    }),
}));

describe("delete_issue", () => {
    beforeEach(() => {
        get.mockReset();
        graphql.mockReset();
    });

    it("pide confirmación vía elicitation y no borra nada si el usuario rechaza", async () => {
        get.mockResolvedValue({
            data: { number: 3, title: "Issue viejo", state: "open", html_url: "https://github.com/octo/hello/issues/3", node_id: "node-3" },
        });

        const { server, getHandler, elicitInput } = createMockServer();
        elicitInput.mockResolvedValue({ action: "decline" });
        registerDeleteIssueTool(server);
        const handler = getHandler("delete_issue");

        const result = await handler({ owner: "octo", repo: "hello", issueNumber: 3 });

        expect(elicitInput).toHaveBeenCalledWith(
            expect.objectContaining({ mode: "form" }),
        );
        expect(graphql).not.toHaveBeenCalled();
        expect(result.content[0]?.text).toContain("cancelada");
    });

    it("no borra nada si el usuario acepta el formulario sin marcar la confirmación", async () => {
        get.mockResolvedValue({
            data: { number: 3, title: "Issue viejo", state: "open", html_url: "https://github.com/octo/hello/issues/3", node_id: "node-3" },
        });

        const { server, getHandler, elicitInput } = createMockServer();
        elicitInput.mockResolvedValue({ action: "accept", content: { confirmDelete: false } });
        registerDeleteIssueTool(server);
        const handler = getHandler("delete_issue");

        const result = await handler({ owner: "octo", repo: "hello", issueNumber: 3 });

        expect(graphql).not.toHaveBeenCalled();
        expect(result.content[0]?.text).toContain("cancelada");
    });

    it("borra el issue vía GraphQL cuando el usuario confirma", async () => {
        get.mockResolvedValue({
            data: { number: 3, title: "Issue viejo", state: "open", html_url: "https://github.com/octo/hello/issues/3", node_id: "node-3" },
        });
        graphql.mockResolvedValue({ deleteIssue: { clientMutationId: null } });

        const { server, getHandler, elicitInput } = createMockServer();
        elicitInput.mockResolvedValue({ action: "accept", content: { confirmDelete: true } });
        registerDeleteIssueTool(server);
        const handler = getHandler("delete_issue");

        const result = await handler({ owner: "octo", repo: "hello", issueNumber: 3 });

        expect(graphql).toHaveBeenCalledWith(expect.stringContaining("deleteIssue"), { issueId: "node-3" });
        expect(result.isError).toBeUndefined();
        expect(result.content[0]?.text).toContain("eliminado");
    });

    it("devuelve un error legible si el issue no existe", async () => {
        get.mockRejectedValue({ status: 404, message: "Not Found" });

        const { server, getHandler, elicitInput } = createMockServer();
        registerDeleteIssueTool(server);
        const handler = getHandler("delete_issue");

        const result = await handler({ owner: "octo", repo: "hello", issueNumber: 999 });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 404");
        expect(graphql).not.toHaveBeenCalled();
        expect(elicitInput).not.toHaveBeenCalled();
    });
});
