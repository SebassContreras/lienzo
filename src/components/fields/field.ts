/**
 * Fields: what a component's data is made of. Each field declares its value type (as a Zod
 * schema), default, label, inspector section and control; the scene schema, the default
 * elements and the inspector are all built from them (A23).
 */
import { z } from "zod";

/** The object a field lives in: the element for top-level fields, else the enclosing object. */
export type Parent = Record<string, unknown>;

/** A value, or a function of the field's parent (labels and ranges that depend on a mode). */
export type Dyn<T> = T | ((parent: Parent) => T);

type Common = {
  label: Dyn<string>;
  /** Inspector section, for top-level fields; nested fields show in their object's section. */
  section?: string;
  /** Shown only while this holds for the field's parent. */
  visible?: (parent: Parent) => boolean;
  /**
   * `false` keeps the field out of the inspector: it is edited on the stage (position, line
   * ends) or derived from other fields (an image's aspect, a group's content).
   */
  inspector?: false;
  /** Writes an edited value into the element draft; by default the field itself is set. */
  set?: (el: Parent, value: unknown) => void;
  /**
   * A position on the canvas (or an object holding `x`/`y`): animation presets store it as an
   * offset from the element and add the element's own value back on apply (019/D6).
   */
  relative?: true;
};

export type NumberField = Common & {
  type: "number";
  default: number;
  schema: z.ZodType<number>;
  min: Dyn<number>;
  max: Dyn<number>;
  step: number;
  /** Edited values are rounded; the schema only takes integers. */
  int?: boolean;
  /** Hard limits: edited values are clamped to them and the schema rejects values outside. */
  bounds?: readonly [number, number];
};

export type ColorField = Common & {
  type: "color";
  default: string;
  schema: z.ZodType<string>;
};

export type CheckField = Common & {
  type: "check";
  default: boolean;
  schema: z.ZodType<boolean>;
};

export type TextField = Common & {
  type: "text";
  default: string;
  schema: z.ZodType<string>;
  multiline?: boolean;
  /** Shown by this widget instead of a text box, as on select fields (062/D8). */
  widget?: string;
};

type Option = readonly [value: string | number, label: string];

export type SelectField = Common & {
  type: "select";
  default: string | number;
  schema: z.ZodType<string | number>;
  options: readonly Option[];
  /** Shown by this widget instead of a drop-down (it gets the options from the field). */
  widget?: string;
};

/** A value edited by a control of its own, named by `widget` (icon picker, image upload…). */
export type CustomField = Common & {
  type: "custom";
  widget: string;
  default: unknown;
  schema: z.ZodType<unknown>;
};

/** A nested object, such as `fill` or `glow`. */
export type ObjectField = Common & {
  type: "object";
  fields: Fields;
  default: Parent;
  schema: z.ZodType<Parent>;
};

/** An inspector control that holds no data of its own (a hint, an action button). */
export type WidgetField = {
  type: "widget";
  widget: string;
  section?: string;
  visible?: (parent: Parent) => boolean;
};

export type DataField =
  | NumberField
  | ColorField
  | CheckField
  | TextField
  | SelectField
  | CustomField
  | ObjectField;

type Field = DataField | WidgetField;

export type Fields = Record<string, Field>;

type DefaultOf<F> = F extends { default: infer T } ? T : never;

/** Data keys whose default may be `undefined` (an optional value, like a fill's `stops`). */
type OptionalKey<F extends Fields, K extends keyof F> = F[K] extends WidgetField
  ? never
  : undefined extends DefaultOf<F[K]>
    ? K
    : never;

/**
 * The value a set of fields describes; widgets hold no data and are left out, and a field
 * whose default may be `undefined` is an optional key.
 */
export type ValueOf<F extends Fields> = {
  -readonly [K in keyof F as F[K] extends WidgetField
    ? never
    : OptionalKey<F, K> extends never
      ? K
      : never]: DefaultOf<F[K]>;
} & {
  -readonly [K in keyof F as OptionalKey<F, K>]?: DefaultOf<F[K]>;
};

/** `T`'s own default type kept on top of the field's erased one. */
type Typed<X, T> = Omit<X, "default" | "schema"> & {
  default: T;
  schema: z.ZodType<T>;
};

type Opts<P, T> = {
  label: string | ((parent: P) => string);
  section?: string;
  visible?: (parent: P) => boolean;
  inspector?: false;
  // biome-ignore lint/suspicious/noExplicitAny: setters are written against the element type
  set?: (el: any, value: T) => void;
  relative?: true;
};

/** Stores typed callbacks under the field's uniform `Parent` signatures. */
function common<P, T>(o: Opts<P, T>): Common {
  return o as unknown as Common;
}

export function num<P = Parent>(
  value: number,
  o: Opts<P, number> & {
    min?: number | ((parent: P) => number);
    max?: number | ((parent: P) => number);
    step?: number;
    int?: boolean;
    bounds?: readonly [number, number];
  },
): Typed<NumberField, number> {
  let schema = z.number();
  if (o.int) schema = schema.int();
  if (o.bounds && Number.isFinite(o.bounds[0]))
    schema = schema.min(o.bounds[0]);
  if (o.bounds && Number.isFinite(o.bounds[1]))
    schema = schema.max(o.bounds[1]);
  return {
    ...common(o),
    type: "number",
    default: value,
    schema,
    min: (o.min ?? 0) as Dyn<number>,
    max: (o.max ?? 100) as Dyn<number>,
    step: o.step ?? 1,
    int: o.int,
    bounds: o.bounds,
  };
}

export function color<P = Parent>(
  value: string,
  o: Opts<P, string>,
): Typed<ColorField, string> {
  return { ...common(o), type: "color", default: value, schema: z.string() };
}

export function check<P = Parent>(
  value: boolean,
  o: Opts<P, boolean>,
): Typed<CheckField, boolean> {
  return { ...common(o), type: "check", default: value, schema: z.boolean() };
}

export function text<P = Parent>(
  value: string,
  o: Opts<P, string> & { multiline?: boolean; widget?: string },
): Typed<TextField, string> {
  return {
    ...common(o),
    type: "text",
    default: value,
    schema: z.string(),
    multiline: o.multiline,
    widget: o.widget,
  };
}

/**
 * A choice among `options`. The schema takes exactly those values unless `schema` says
 * otherwise (fonts are any string; animation kinds are checked against every kind).
 */
export function select<T extends string | number, P = Parent>(
  options: readonly (readonly [T, string])[],
  value: NoInfer<T>,
  o: Opts<P, T> & { schema?: z.ZodType<T>; widget?: string },
): Typed<SelectField, T> {
  const values = options.map(([v]) => v);
  const schema =
    o.schema ??
    (typeof value === "number"
      ? z.number().refine((v) => values.includes(v as T))
      : z.enum(values as unknown as [string, ...string[]]));
  return {
    ...common(o),
    type: "select",
    default: value,
    schema: schema as z.ZodType<T>,
    options,
  };
}

/**
 * `f` with its default filled in when the value is missing, so scenes saved before the field
 * existed still parse and read as they did.
 */
export function defaulted<F extends { default: unknown; schema: z.ZodType }>(
  f: F,
): F {
  return { ...f, schema: f.schema.default(f.default) as F["schema"] };
}

export function custom<T, P = Parent>(
  widget: string,
  value: T,
  schema: z.ZodType<T>,
  o: Opts<P, T>,
): Typed<CustomField, T> {
  return { ...common(o), type: "custom", widget, default: value, schema };
}

export function widget<P = Parent>(
  name: string,
  o: { section?: string; visible?: (parent: P) => boolean } = {},
): WidgetField {
  return {
    ...(o as Pick<WidgetField, "section" | "visible">),
    type: "widget",
    widget: name,
  };
}

/** The data fields of `fields`, in order. */
export function dataFields(fields: Fields): [string, DataField][] {
  return Object.entries(fields).filter(
    (e): e is [string, DataField] => e[1].type !== "widget",
  );
}

/** A fresh copy of the value `fields` describe, each field at its default. */
export function defaultsOf<F extends Fields>(fields: F): ValueOf<F> {
  return Object.fromEntries(
    dataFields(fields).map(([k, f]) => [k, structuredClone(f.default)]),
  ) as ValueOf<F>;
}

/** The Zod shape (key → schema) of the value `fields` describe. */
export function shapeOf(fields: Fields): Record<string, z.ZodType> {
  return Object.fromEntries(dataFields(fields).map(([k, f]) => [k, f.schema]));
}

/** The Zod object for the value `fields` describe. */
export function schemaOf<F extends Fields>(fields: F): z.ZodType<ValueOf<F>> {
  return z.object(shapeOf(fields)) as unknown as z.ZodType<ValueOf<F>>;
}

export function obj<F extends Fields, P = Parent>(
  fields: F,
  o: Omit<Opts<P, ValueOf<F>>, "label"> & { label?: string },
): Typed<ObjectField, ValueOf<F>> & { fields: F } {
  return {
    ...common({ label: "", ...o }),
    type: "object",
    fields,
    default: defaultsOf(fields),
    schema: schemaOf(fields),
  };
}
