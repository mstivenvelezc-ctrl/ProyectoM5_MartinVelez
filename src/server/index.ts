import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerListRepositoriesTool } from "../tools/listRepositories.js";
import { registerCreateRepositoryTool } from "../tools/createRepository.js";
import { registerCreateIssueTool } from "../tools/createIssue.js";
import { registerListIssuesTool } from "../tools/listIssues.js";
import { registerCreateCommitTool } from "../tools/createCommit.js";
import { registerGetRepositoryTool } from "../tools/getRepository.js";
import { registerDeleteIssueTool } from "../tools/deletIssue.js";
import { registerDeleteRepositoryTool } from "../tools/deleteRepository.js";
import { registerRevertToCommitTool } from "../tools/revertToCommit.js";

export const server = new McpServer({
    name: "mstivenvelezc-ctrl-agent",
    version: "1.0.0",
});

async function main() {
    registerGetRepositoryTool(server);
    registerCreateRepositoryTool(server);
    registerListRepositoriesTool(server);
    registerCreateIssueTool(server);
    registerListIssuesTool(server);
    registerCreateCommitTool(server);
    registerDeleteIssueTool(server);
    registerDeleteRepositoryTool(server);
    registerRevertToCommitTool(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Server is running...");
}

main().catch((error) => {
    console.error("Error starting the server:", error);
    process.exit(1);
});