import { z } from "zod";
import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, ok } from "../lib/result.js";
import { commitMessageSchema, ownerSchema, repoNameSchema, requiredBranchSchema, } from "../schemas/github.js";
export function registerMergeBranchTool(server) {
    server.registerTool("merge_branch", {
        title: "Fusionar rama",
        description: "Fusiona una rama (head) dentro de otra rama base (por defecto 'main'). " +
            "Equivale a hacer un merge de una rama feature hacia la rama principal del repositorio.",
        inputSchema: {
            owner: ownerSchema,
            repo: repoNameSchema,
            head: requiredBranchSchema.describe("Rama de origen que se quiere fusionar (ej. 'feature/mi-cambio')."),
            base: requiredBranchSchema
                .default("main")
                .describe("Rama de destino. Por defecto 'main'."),
            commit_message: commitMessageSchema.optional().describe("Mensaje del merge commit. Si se omite, GitHub genera uno automático."),
        },
    }, async ({ owner, repo, head, base, commit_message }) => {
        try {
            const octokit = getOctokit();
            const { data } = await octokit.repos.merge({
                owner,
                repo,
                base,
                head,
                ...(commit_message !== undefined && { commit_message }),
            });
            if (data === null) {
                return ok(`La rama '${head}' ya estaba al día con '${base}'. No se creó ningún commit.`);
            }
            return ok(`Fusión completada: '${head}' → '${base}'\n` +
                `Merge commit: ${data.sha}\n` +
                `URL: ${data.html_url ?? "(sin URL)"}`);
        }
        catch (error) {
            return fail(githubErrorMessage(error));
        }
    });
}
//# sourceMappingURL=mergeBranch.js.map