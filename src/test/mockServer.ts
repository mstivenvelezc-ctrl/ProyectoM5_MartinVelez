import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { vi } from "vitest";

export type ToolResult = {
    content: { type: "text"; text: string }[];
    isError?: boolean;
};

export type ToolHandler = (args: any) => Promise<ToolResult>;

// Stub mínimo de McpServer: solo captura los handlers registrados con
// registerTool, sin levantar transporte ni validar el inputSchema.
export function createMockServer() {
    const handlers = new Map<string, ToolHandler>();
    const elicitInput = vi.fn();

    const registerTool = vi.fn(
        (name: string, _config: unknown, handler: ToolHandler) => {
            handlers.set(name, handler);
        },
    );

    function getHandler(name: string): ToolHandler {
        const handler = handlers.get(name);
        if (!handler) {
            throw new Error(`La tool "${name}" no fue registrada.`);
        }
        return handler;
    }

    return {
        server: {
            registerTool,
            server: { elicitInput },
        } as unknown as McpServer,
        getHandler,
        elicitInput,
    };
}
