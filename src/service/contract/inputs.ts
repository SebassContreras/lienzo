/**
 * Inputs derived from a tool's input schema (082/D5): a base input that satisfies the schema's
 * types, and variants that break it in one named way. Pure and deterministic; no dependency.
 *
 * A variant breaks top-level keys, so those keys are the paths a failing call must report.
 */
import { z } from "zod";

/** The slice of JSON Schema that `z.toJSONSchema` gives for a tool's input. */
export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  minItems?: number;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
};

export type Input = Record<string, unknown>;

/** One way to break an input: what was done, the keys a failure must report, the input. */
export type Variant = { label: string; paths: string[]; input: Input };

export function inputSchemaOf(schema: z.ZodType): JsonSchema {
  return z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as JsonSchema;
}

/** The one type a schema says, when it says exactly one (a nullable or a union has none). */
function simpleType(schema: JsonSchema): string | undefined {
  if (schema.anyOf) return undefined;
  return typeof schema.type === "string" ? schema.type : undefined;
}

function validValue(schema: JsonSchema): unknown {
  if (schema.enum) return schema.enum[0];
  if (schema.anyOf) return validValue(schema.anyOf[0] ?? {});
  switch (simpleType(schema)) {
    case "string":
      return "x".repeat(Math.max(1, schema.minLength ?? 1));
    case "number":
    case "integer": {
      const low = schema.minimum ?? (schema.exclusiveMinimum ?? 0) + 1;
      return Math.min(low, schema.maximum ?? low);
    }
    case "boolean":
      return false;
    case "array":
      return Array.from({ length: schema.minItems ?? 0 }, () =>
        validValue(schema.items ?? {}),
      );
    case "object":
      return requiredOf(schema, {});
    default:
      return {};
  }
}

function requiredOf(schema: JsonSchema, fixed: Input): Input {
  const out: Input = {};
  for (const key of schema.required ?? []) {
    out[key] =
      key in fixed ? fixed[key] : validValue(schema.properties?.[key] ?? {});
  }
  return out;
}

/**
 * The smallest input that satisfies the schema's types: every required key with a value of its
 * type. `fixed` gives values to use instead (`{ project: "p" }`); a key of `fixed` the schema
 * declares is also set when it is optional.
 */
export function baseInput(schema: JsonSchema, fixed: Input = {}): Input {
  const base = requiredOf(schema, fixed);
  for (const key of Object.keys(fixed)) {
    if (schema.properties?.[key]) base[key] = fixed[key];
  }
  return base;
}

/** A value of another type than the schema's (or an option it does not list). */
function wrongValue(schema: JsonSchema): unknown {
  if (schema.enum) return "__no_such_option__";
  return simpleType(schema) === "string" ? 5 : "x";
}

type Break = { key: string; label: string; apply: (input: Input) => Input };

const set = (key: string, value: unknown) => (input: Input) => ({
  ...input,
  [key]: value,
});
const drop = (key: string) => (input: Input) => {
  const { [key]: _gone, ...rest } = input;
  return rest;
};

/** Values just outside the range a numeric or string schema states, if it states one. */
function rangeBreaks(key: string, schema: JsonSchema): Break[] {
  const type = simpleType(schema);
  const breaks: Break[] = [];
  const add = (label: string, value: unknown) =>
    breaks.push({ key, label: `${key} ${label}`, apply: set(key, value) });
  if (type === "number" || type === "integer") {
    if (schema.minimum !== undefined)
      add("below its minimum", schema.minimum - 1);
    if (schema.exclusiveMinimum !== undefined)
      add("at its exclusive minimum", schema.exclusiveMinimum);
    if (schema.maximum !== undefined)
      add("above its maximum", schema.maximum + 1);
    if (schema.exclusiveMaximum !== undefined)
      add("at its exclusive maximum", schema.exclusiveMaximum);
    if (type === "integer")
      add("not a whole number", Number(validValue(schema)) + 0.5);
  }
  if (type === "string" && (schema.minLength ?? 0) >= 1) add("empty", "");
  return breaks;
}

function breaksOf(schema: JsonSchema): Break[] {
  const breaks: Break[] = [];
  for (const key of schema.required ?? []) {
    const prop = schema.properties?.[key] ?? {};
    breaks.push({ key, label: `${key} missing`, apply: drop(key) });
    // null breaks a typed key; an untyped one (`z.unknown()`) takes it and fails later, by rule
    if (simpleType(prop) || prop.enum)
      breaks.push({ key, label: `${key} null`, apply: set(key, null) });
  }
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    if (simpleType(prop) || prop.enum) {
      breaks.push({
        key,
        label: `${key} ${prop.enum ? "an unknown option" : "of the wrong type"}`,
        apply: set(key, wrongValue(prop)),
      });
    }
    breaks.push(...rangeBreaks(key, prop));
  }
  return breaks;
}

/**
 * Every single-key breakage of `base` the schema lets us predict: a required key missing or
 * null, a value of the wrong type or option, a number outside its range, an empty string where
 * one is not allowed. And one input that breaks two different keys at once (when the schema has
 * two), which a failing call must report together.
 */
export function invalidVariants(schema: JsonSchema, base: Input): Variant[] {
  const breaks = breaksOf(schema);
  const variants = breaks.map(
    (b): Variant => ({
      label: b.label,
      paths: [b.key],
      input: b.apply(base),
    }),
  );
  const first = breaks[0];
  const other = breaks.find((b) => first && b.key !== first.key);
  if (first && other) {
    variants.push({
      label: `${first.key} and ${other.key} both broken`,
      paths: [first.key, other.key],
      input: other.apply(first.apply(base)),
    });
  }
  return variants;
}

/** The required keys whose value is an object or an array: the ones a JSON string may carry. */
export function structuredKeys(schema: JsonSchema): string[] {
  return (schema.required ?? []).filter((key) => {
    const type = simpleType(schema.properties?.[key] ?? {});
    return type === "object" || type === "array";
  });
}
