import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, ok } from "../lib/result.js";
import { ownerSchema, repoNameSchema } from "../schemas/github.js";
export function registerGetRepositoryTool(server) {
    server.registerTool("get_repository", {
        title: "Traer repositorio",
        description: "Trae un repositorio por nombre (owner + repo) con su información principal.",
        inputSchema: {
            owner: ownerSchema,
            repo: repoNameSchema,
        },
    }, async ({ owner, repo }) => {
        try {
            const octokit = getOctokit();
            const { data } = await octokit.repos.get({ owner, repo });
            return ok(`Repositorio: ${data.full_name}\n` +
                `Descripción: ${data.description ?? "(sin descripción)"}\n` +
                `Privado: ${data.private ? "sí" : "no"}\n` +
                `Lenguaje: ${data.language ?? "n/d"}\n` +
                `Estrellas: ${data.stargazers_count} | Forks: ${data.forks_count} | ` +
                `Issues abiertos: ${data.open_issues_count}\n` +
                `Rama por defecto: ${data.default_branch}\n` +
                `URL: ${data.html_url}`);
        }
        catch (error) {
            return fail(githubErrorMessage(error));
        }
    });
}
//# sourceMappingURL=getRepository.js.map