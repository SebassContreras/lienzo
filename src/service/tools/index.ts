/**
 * Every tool, one file each (A20); the CLI (008) and the MCP server (009) expose `registry`.
 * A new tool is a file here plus one line in `TOOLS`.
 */
import { createRegistry, type Tool } from "../registry.ts";
import { backgroundSet } from "./background-set.ts";
import { componentList } from "./component-list.ts";
import { elementAdd } from "./element-add.ts";
import { elementMove } from "./element-move.ts";
import { elementRemove } from "./element-remove.ts";
import { elementUpdate } from "./element-update.ts";
import { keyframeRemove } from "./keyframe-remove.ts";
import { keyframeSet } from "./keyframe-set.ts";
import { presetGet } from "./preset-get.ts";
import { presetList } from "./preset-list.ts";
import { presetValidate } from "./preset-validate.ts";
import { sceneBuild } from "./scene-build.ts";
import { sceneCreate } from "./scene-create.ts";
import { sceneExport } from "./scene-export.ts";
import { sceneGet } from "./scene-get.ts";
import { sceneInspectLayout } from "./scene-inspect-layout.ts";
import { sceneList } from "./scene-list.ts";
import { scenePreview } from "./scene-preview.ts";
import { projectCreate } from "./project-create.ts";
import { projectDelete } from "./project-delete.ts";
import { projectInspect } from "./project-inspect.ts";
import { projectList } from "./project-list.ts";
import { sceneGenerateSpeech } from "./scene-generate-speech.ts";
import { sceneValidate } from "./scene-validate.ts";

export const TOOLS: readonly Tool[] = [
  componentList,
  presetList,
  presetGet,
  presetValidate,
  projectList,
  projectInspect,
  projectCreate,
  projectDelete,
  sceneList,
  sceneGet,
  sceneCreate,
  sceneBuild,
  sceneValidate,
  scenePreview,
  sceneExport,
  sceneInspectLayout,
  elementAdd,
  elementUpdate,
  elementRemove,
  elementMove,
  backgroundSet,
  keyframeSet,
  keyframeRemove,
  sceneGenerateSpeech,
];

export const registry = createRegistry(TOOLS);
