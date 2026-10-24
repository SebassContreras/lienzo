# 051 — nested-tools-and-validation — Requirements

Agents building shot-based or grouped scenes cannot edit nested elements with `element_update`, `keyframe_set` or sibling tools because lookup only scans top-level elements, and when a compact scene has an invalid field inside a nested element, validation fails with a generic top-level error (`compact.elements.3: Invalid input`) instead of pointing to the offending field.

- R1@1: Every element and keyframe service tool (`element_update`, `element_remove`, `element_add`, `keyframe_set`, `keyframe_remove`, `image_trim`, etc.) resolves element targets across the full element tree (nested groups at any depth), accepting both a unique element `id` and a slash-separated path (`shot-1/s1-car`).
- R2@1: `element_add` accepts an optional `parent` (`id` or path of a `group` element) to insert a new element inside that group instead of only at the scene root; if `parent` does not exist or is not a `group`, it fails with a clear error and leaves the scene unchanged.
- R3@1: When validating a compact element (`CompactElementSchema`) that includes a recognized `kind`, validation checks against that `kind`'s specific schema (recursing into `children` when `kind` is `"group"`) and reports the deepest field path and reason (e.g. `elements.3.children.1.speed: must be an integer >= 1`) rather than a generic union failure.
- R4@1: When `kind` is missing or unknown on a compact element, validation reports the missing/invalid `kind` at that element's exact path.
