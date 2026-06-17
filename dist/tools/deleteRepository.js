import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, needsConfirmation, ok } from "../lib/result.js";
import { confirmNameSchema, confirmSchema, ownerSchema, repoNameSchema, } from "../schemas/github.js";
export function registerDeleteRepositoryTool(server) {
    server.registerTool("delete_repository", {
        title: "Eliminar repositorio",
        description: "Elimina permanentemente un repositorio (owner + repo). Requiere un token " +
            "con scope delete_repo. Acción irreversible: pide confirmación y reescribir el nombre.",
        annotations: {
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
        inputSchema: {
            owner: ownerSchema,
            repo: repoNameSchema,
            confirm: confirmSchema,
            confirmName: confirmNameSchema,
        },
    }, async ({ owner, repo, confirm, confirmName }) => {
        try {
            const octokit = getOctokit();
            const fullName = `${owner}/${repo}`;
            // Paso 1: sin confirmar todavía -> solo alerta, no ejecuta.
            if (!confirm) {
                return needsConfirmation(`Se eliminará PERMANENTEMENTE el repositorio ${fullName}.\n` +
                    "Esto borra también todos sus issues, pull requests, wiki, releases y forks de la red.\n" +
                    "No se puede recuperar.\n\n" +
                    `Para proceder, vuelve a llamar la tool con "confirm": true y "confirmName": "${fullName}".`);
            }
            // Paso 2: confirmado, pero el nombre debe coincidir exactamente.
            if (confirmName !== fullName) {
                return fail("❌ El nombre de confirmación no coincide. No se eliminó nada.\n" +
                    `Esperado: "${fullName}"\n` +
                    `Recibido: "${confirmName ?? "(vacío)"}"\n` +
                    `Reescribe exactamente "${fullName}" en confirmName para confirmar.`);
            }
            await octokit.repos.delete({ owner, repo });
            return ok(`Repositorio ${fullName} eliminado permanentemente.`);
        }
        catch (error) {
            return fail(githubErrorMessage(error));
        }
    });
}
//# sourceMappingURL=deleteRepository.js.map