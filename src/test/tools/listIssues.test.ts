import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockServer } from "../mockServer.js";
import { registerListIssuesTool } from "../../tools/listIssues.js";

const listForRepo = vi.fn();

vi.mock("../../github/client.js", () => ({
    getOctokit: () => ({
        issues: { listForRepo },
    }),
}));

describe("list_issues", () => {
    beforeEach(() => {
        listForRepo.mockReset();
    });

    it("lista los issues y filtra los pull requests", async () => {
        listForRepo.mockResolvedValue({
            data: [
                { number: 1, state: "open", title: "Issue real" },
                { number: 2, state: "open", title: "PR disfrazado", pull_request: {} },
            ],
        });

        const { server, getHandler } = createMockServer();
        registerListIssuesTool(server);
        const handler = getHandler("list_issues");

        const result = await handler({ owner: "octo", repo: "hello", state: "open", perPage: 30 });

        expect(listForRepo).toHaveBeenCalledWith({ owner: "octo", repo: "hello", state: "open", per_page: 30 });
        expect(result.content[0]?.text).toContain("(1)");
        expect(result.content[0]?.text).toContain("#1");
        expect(result.content[0]?.text).not.toContain("#2");
    });

    it("informa cuando no hay issues", async () => {
        listForRepo.mockResolvedValue({ data: [] });

        const { server, getHandler } = createMockServer();
        registerListIssuesTool(server);
        const handler = getHandler("list_issues");

        const result = await handler({ owner: "octo", repo: "hello", state: "closed", perPage: 30 });

        expect(result.content[0]?.text).toContain("No hay issues");
    });

    it("devuelve un error legible si la API de GitHub falla", async () => {
        listForRepo.mockRejectedValue({ status: 404, message: "Not Found" });

        const { server, getHandler } = createMockServer();
        registerListIssuesTool(server);
        const handler = getHandler("list_issues");

        const result = await handler({ owner: "octo", repo: "no-existe", state: "open", perPage: 30 });

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("HTTP 404");
    });
});
