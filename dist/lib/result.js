export function ok(text) {
    return { content: [{ type: "text", text }] };
}
export function fail(text) {
    return { content: [{ type: "text", text }], isError: true };
}
// Octokit lanza errores con `status` (HTTP) y `message`.
export function githubErrorMessage(error) {
    if (typeof error === "object" && error !== null && "status" in error) {
        const e = error;
        const status = e.status ? ` (HTTP ${e.status})` : "";
        return `Error de la API de GitHub${status}: ${e.message ?? "error desconocido"}`;
    }
    return error instanceof Error ? error.message : "Error desconocido.";
}
export function needsConfirmation(text) {
    return {
        content: [
            {
                type: "text",
                text: "⚠️ ACCIÓN DESTRUCTIVA — REQUIERE CONFIRMACIÓN ⚠️\n\n" +
                    `${text}\n\n` +
                    'Esta acción NO se ha ejecutado. Para proceder, vuelve a llamar la tool con "confirm": true.',
            },
        ],
    };
}
//# sourceMappingURL=result.js.map