export declare function ok(text: string): {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare function fail(text: string): {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
};
export declare function githubErrorMessage(error: unknown): string;
export declare function needsConfirmation(text: string): {
    content: {
        type: "text";
        text: string;
    }[];
};
//# sourceMappingURL=result.d.ts.map