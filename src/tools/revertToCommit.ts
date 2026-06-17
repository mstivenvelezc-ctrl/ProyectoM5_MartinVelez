import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, needsConfirmation, ok } from "../lib/result.js";
import {
    branchSchema,
    commitShaSchema,
    confirmSchema,
    ownerSchema,
    repoNameSchema,
} from "../schemas/github.js";

export function registerRevertToCommitTool(server: McpServer) {
    server.registerTool(
        "revert_to_commit",
        {
            title: "Regresar a un commit anterior",
            description:
                "Mueve una rama a un commit anterior (hard reset). Descarta los commits " +
                "posteriores al SHA indicado. Acción destructiva: pide confirmación.",
            annotations: {
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: true,
            },
            inputSchema: {
                owner: ownerSchema,
                repo: repoNameSchema,
                sha: commitShaSchema,
                branch: branchSchema,
                confirm: confirmSchema,
            },
        },
        async ({ owner, repo, sha, branch, confirm }) => {
            try {
                const octokit = getOctokit();

                // Si no se indica rama, usamos la rama por defecto del repo.
                let targetBranch = branch;
                if (targetBranch === undefined) {
                    const { data: repoData } = await octokit.repos.get({ owner, repo });
                    targetBranch = repoData.default_branch;
                }

                if (!confirm) {
                    return needsConfirmation(
                        `Se moverá la rama "${targetBranch}" de ${owner}/${repo} al commit ${sha}.\n` +
                        "Todos los commits posteriores a ese SHA en esa rama se perderán de la historia " +
                        "(reescritura forzada). Asegúrate de tener respaldo si los necesitas.",
                    );
                }

                const { data } = await octokit.git.updateRef({
                    owner,
                    repo,
                    ref: `heads/${targetBranch}`,
                    sha,
                    force: true,
                });

                return ok(
                    `Rama "${targetBranch}" de ${owner}/${repo} movida al commit ${data.object.sha}.`,
                );
            } catch (error) {
                return fail(githubErrorMessage(error));
            }
        },
    );
}