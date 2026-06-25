import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOctokit } from "../github/client.js";
import { fail, githubErrorMessage, ok } from "../lib/result.js";
import {
    issueNumberSchema,
    ownerSchema,
    repoNameSchema,
} from "../schemas/github.js";

export function registerDeleteIssueTool(server: McpServer) {
    server.registerTool(
        "delete_issue",
        {
            title: "Eliminar issue",
            description:
                "Elimina permanentemente un issue (vía GraphQL deleteIssue). " +
                "Requiere ser admin/owner del repo. Acción irreversible: pide confirmación real " +
                "al usuario mediante un formulario (elicitation) que el agente no puede rellenar por sí solo.",
            annotations: {
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                owner: ownerSchema,
                repo: repoNameSchema,
                issueNumber: issueNumberSchema,
            },
        },
        async ({ owner, repo, issueNumber }) => {
            try {
                const octokit = getOctokit();

                // Traemos el issue (lectura) para mostrar qué se va a borrar
                // y para obtener su node_id (necesario para la mutación GraphQL).
                const { data: issue } = await octokit.issues.get({
                    owner,
                    repo,
                    issue_number: issueNumber,
                });

                const elicitation = await server.server.elicitInput({
                    mode: "form",
                    message:
                        `⚠️ Se eliminará PERMANENTEMENTE el issue #${issue.number} de ${owner}/${repo}:\n` +
                        `"${issue.title}" (estado: ${issue.state})\n` +
                        `URL: ${issue.html_url}\n\n` +
                        "El issue no se puede recuperar después de borrarlo.",
                    requestedSchema: {
                        type: "object",
                        properties: {
                            confirmDelete: {
                                type: "boolean",
                                title: "Confirmo que quiero eliminar este issue",
                                description: "Marca esta casilla para confirmar el borrado.",
                                default: false,
                            },
                        },
                        required: ["confirmDelete"],
                    },
                });

                if (elicitation.action !== "accept" || elicitation.content?.confirmDelete !== true) {
                    return ok(`Eliminación del issue #${issue.number} cancelada por el usuario.`);
                }

                await octokit.graphql(
                    `mutation($issueId: ID!) {
                        deleteIssue(input: { issueId: $issueId }) {
                            clientMutationId
                        }
                    }`,
                    { issueId: issue.node_id },
                );

                return ok(
                    `Issue #${issue.number} eliminado de ${owner}/${repo}: "${issue.title}".`,
                );
            } catch (error) {
                return fail(githubErrorMessage(error));
            }
        },
    );
}