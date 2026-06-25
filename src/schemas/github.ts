import { z } from "zod";

// Nombre de repositorio: 3-100 caracteres, solo alfanuméricos y guiones.
// (GitHub además permite "_" y ".", pero aquí aplicamos la regla pedida.)
export const repoNameSchema = z
    .string()
    .trim()
    .min(3, "El nombre del repositorio debe tener al menos 3 caracteres.")
    .max(100, "El nombre del repositorio no puede superar los 100 caracteres.")
    .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Nombre inválido: solo se permiten letras, números, guiones, puntos y underscores (sin espacios ni símbolos).",
    );

// Owner = usuario u organización. Reglas de username de GitHub:
// 1-39 caracteres, alfanuméricos y guiones simples, sin empezar/terminar en guion.
export const ownerSchema = z
    .string()
    .trim()
    .min(1, "El owner (usuario u organización) es obligatorio.")
    .max(39, "El owner no puede superar los 39 caracteres.")
    .regex(
        /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
        "Owner inválido: usa un usuario/organización válido de GitHub (letras, números y guiones, sin empezar ni terminar en guion).",
    );

export const repoDescriptionSchema = z
    .string()
    .trim()
    .max(350, "La descripción no puede superar los 350 caracteres.")
    .optional();

export const issueTitleSchema = z
    .string()
    .trim()
    .min(1, "El título del issue no puede estar vacío.")
    .max(256, "El título del issue no puede superar los 256 caracteres.");

export const issueBodySchema = z
    .string()
    .max(65536, "El cuerpo del issue es demasiado largo.")
    .optional();

export const issueStateSchema = z
    .enum(["open", "closed", "all"])
    .optional()
    .default("open");

export const filePathSchema = z
    .string()
    .trim()
    .min(1, "La ruta del archivo es obligatoria.")
    .max(255, "La ruta del archivo es demasiado larga.")
    .refine((p) => !p.startsWith("/"), "La ruta no debe empezar con '/'.")
    .refine((p) => !p.split("/").includes(".."), "La ruta no puede contener '..'.");

export const commitMessageSchema = z
    .string()
    .trim()
    .min(1, "El mensaje de commit no puede estar vacío.")
    .max(1000, "El mensaje de commit es demasiado largo.");

// Contenido del archivo (texto plano; se codifica a base64 antes de enviarlo).
export const fileContentSchema = z
    .string()
    .max(1_000_000, "El contenido del archivo es demasiado grande.");

// Rama opcional. Si se omite, GitHub usa la rama por defecto del repo.
export const branchSchema = z
    .string()
    .trim()
    .min(1, "El nombre de la rama no puede estar vacío.")
    .optional();

// Rama requerida (sin .optional()).
export const requiredBranchSchema = z
    .string()
    .trim()
    .min(1, "El nombre de la rama no puede estar vacío.")
    .max(255, "El nombre de la rama es demasiado largo.")
    .regex(
        /^[^\s~^:?*\[\\]+(?<!\.lock)$/,
        "Nombre de rama inválido según las reglas de Git.",
    );

export const isPrivateSchema = z.boolean().optional().default(false);

export const perPageSchema = z
    .number()
    .int("Debe ser un número entero.")
    .min(1, "El mínimo es 1.")
    .max(100, "El máximo permitido por GitHub es 100.")
    .optional()
    .default(30);

// Número de issue (entero positivo).
export const issueNumberSchema = z
    .number()
    .int("El número de issue debe ser un entero.")
    .positive("El número de issue debe ser mayor que 0.");

// SHA de commit: hexadecimal de 7 a 40 caracteres.
export const commitShaSchema = z
    .string()
    .trim()
    .regex(
        /^[0-9a-f]{7,40}$/i,
        "SHA inválido: debe ser hexadecimal de 7 a 40 caracteres.",
    );

// Confirmación humana para acciones destructivas.
export const confirmSchema = z
    .boolean()
    .optional()
    .default(false)
    .describe(
        "Debe ser true para ejecutar la acción destructiva. Si es false, la tool solo muestra una alerta sin ejecutar.",
    );
