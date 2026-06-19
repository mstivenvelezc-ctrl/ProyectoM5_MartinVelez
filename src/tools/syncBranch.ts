import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, ok } from "../lib/result.js";
import {
    commitMessageSchema,
    ownerSchema,
    repoNameSchema,
    requiredBranchSchema,
} from "../schemas/github.js";

export function registerSyncBranchTool(server: McpServer) {
    server.registerTool(
        "sync_branch",
        {
            title: "Sincronizar rama con principal",
            description:
                "Trae los últimos cambios de la rama principal (por defecto 'main') " +
                "y los fusiona dentro de la rama indicada, manteniéndola actualizada.",
            inputSchema: {
                owner: ownerSchema,
                repo: repoNameSchema,
                branch: requiredBranchSchema.describe(
                    "Rama que se quiere actualizar con los cambios de la principal (ej. 'feature/mi-cambio').",
                ),
                base: requiredBranchSchema
                    .default("main")
                    .describe("Rama fuente de los cambios. Por defecto 'main'."),
                commit_message: commitMessageSchema.optional().describe(
                    "Mensaje del merge commit. Si se omite, GitHub genera uno automático.",
                ),
            },
        },
        async ({ owner, repo, branch, base, commit_message }) => {
            try {
                const octokit = getOctokit();

                const { data } = await octokit.repos.merge({
                    owner,
                    repo,
                    base: branch,
                    head: base,
                    ...(commit_message !== undefined && { commit_message }),
                });

                if (data === null) {
                    return ok(
                        `La rama '${branch}' ya está al día con '${base}'. No hay cambios nuevos.`,
                    );
                }

                return ok(
                    `Rama '${branch}' actualizada con los cambios de '${base}'.\n` +
                    `Merge commit: ${data.sha}\n` +
                    `URL: ${data.html_url ?? "(sin URL)"}`,
                );
            } catch (error) {
                return fail(githubErrorMessage(error));
            }
        },
    );
}
