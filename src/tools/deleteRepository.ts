import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, ok } from "../lib/result.js";
import { ownerSchema, repoNameSchema } from "../schemas/github.js";

export function registerDeleteRepositoryTool(server: McpServer) {
    server.registerTool(
        "delete_repository",
        {
            title: "Eliminar repositorio",
            description:
                "Elimina permanentemente un repositorio (owner + repo). Requiere un token " +
                "con scope delete_repo. Acción irreversible: pide confirmación real al usuario " +
                "mediante un formulario (elicitation) que el agente no puede rellenar por sí solo.",
            annotations: {
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                owner: ownerSchema,
                repo: repoNameSchema,
            },
        },
        async ({ owner, repo }) => {
            try {
                const fullName = `${owner}/${repo}`;

                // Confirmación real vía MCP elicitation: el cliente debe mostrarle
                // este formulario al humano, no se puede resolver desde el propio agente.
                const elicitation = await server.server.elicitInput({
                    mode: "form",
                    message:
                        `⚠️ Se eliminará PERMANENTEMENTE el repositorio ${fullName}.\n` +
                        "Esto borra también todos sus issues, pull requests, wiki, releases y " +
                        "forks de la red. No se puede recuperar.",
                    requestedSchema: {
                        type: "object",
                        properties: {
                            confirmName: {
                                type: "string",
                                title: `Escribe "${fullName}" para confirmar`,
                                description: `Para proceder, escribe exactamente "${fullName}".`,
                                minLength: fullName.length,
                                maxLength: fullName.length,
                            },
                        },
                        required: ["confirmName"],
                    },
                });

                if (elicitation.action !== "accept" || !elicitation.content) {
                    return ok(`Eliminación de ${fullName} cancelada por el usuario.`);
                }

                if (elicitation.content.confirmName !== fullName) {
                    return fail(
                        "❌ El nombre de confirmación no coincide. No se eliminó nada.\n" +
                        `Esperado: "${fullName}"\n` +
                        `Recibido: "${elicitation.content.confirmName ?? "(vacío)"}"`,
                    );
                }

                const octokit = getOctokit();
                await octokit.repos.delete({ owner, repo });

                return ok(`Repositorio ${fullName} eliminado permanentemente.`);
            } catch (error) {
                return fail(githubErrorMessage(error));
            }
        },
    );
}