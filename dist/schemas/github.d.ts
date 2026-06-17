import { z } from "zod";
export declare const repoNameSchema: z.ZodString;
export declare const ownerSchema: z.ZodString;
export declare const repoDescriptionSchema: z.ZodOptional<z.ZodString>;
export declare const issueTitleSchema: z.ZodString;
export declare const issueBodySchema: z.ZodOptional<z.ZodString>;
export declare const issueStateSchema: z.ZodDefault<z.ZodOptional<z.ZodEnum<["open", "closed", "all"]>>>;
export declare const filePathSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
export declare const commitMessageSchema: z.ZodString;
export declare const fileContentSchema: z.ZodString;
export declare const branchSchema: z.ZodOptional<z.ZodString>;
export declare const isPrivateSchema: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
export declare const perPageSchema: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
export declare const issueNumberSchema: z.ZodNumber;
export declare const commitShaSchema: z.ZodString;
export declare const confirmSchema: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
export declare const confirmNameSchema: z.ZodOptional<z.ZodString>;
//# sourceMappingURL=github.d.ts.map