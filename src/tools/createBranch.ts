import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, ok } from "../lib/result.js";
import {
    ownerSchema,
    repoNameSchema,
    requiredBranchSchema,
} from "../schemas/github.js";

export function registerCreateBranchTool(server: McpServer) {
    server.registerTool(
        "create_branch",
        {
            title: "Crear rama",
            description:
                "Crea una nueva rama en el repositorio a partir de una rama base existente (por defecto 'main').",
            inputSchema: {
                owner: ownerSchema,
                repo: repoNameSchema,
                branch: requiredBranchSchema.describe(
                    "Nombre de la nueva rama a crear (ej. 'feature/mi-cambio').",
                ),
                base: requiredBranchSchema
                    .default("main")
                    .describe(
                        "Rama desde la que se crea la nueva rama. Por defecto 'main'.",
                    ),
            },
        },
        async ({ owner, repo, branch, base }) => {
            try {
                const octokit = getOctokit();

                // Obtenemos el SHA del último commit de la rama base.
                const { data: ref } = await octokit.git.getRef({
                    owner,
                    repo,
                    ref: `heads/${base}`,
                });

                const sha = ref.object.sha;

                await octokit.git.createRef({
                    owner,
                    repo,
                    ref: `refs/heads/${branch}`,
                    sha,
                });

                return ok(
                    `Rama '${branch}' creada con éxito a partir de '${base}'.\n` +
                    `SHA base: ${sha}`,
                );
            } catch (error) {
                return fail(githubErrorMessage(error));
            }
        },
    );
}
