/**
 * Every tool, one file each (A20); the CLI (008) and the MCP server (009) expose `registry`.
 * A new tool is a file here plus one line in `TOOLS`.
 */
import { createRegistry, type Tool } from "../registry.ts";
import { backgroundSet } from "../scenes/tools/background-set.ts";
import { sceneBuild } from "../scenes/tools/scene-build.ts";
import { sceneCreate } from "../scenes/tools/scene-create.ts";
import { sceneDelete } from "../scenes/tools/scene-delete.ts";
import { sceneGet } from "../scenes/tools/scene-get.ts";
import { sceneList } from "../scenes/tools/scene-list.ts";
import { sceneRename } from "../scenes/tools/scene-rename.ts";
import { sceneUpdate } from "../scenes/tools/scene-update.ts";
import { sceneValidate } from "../scenes/tools/scene-validate.ts";
import { animationDelete } from "./animation-delete.ts";
import { animationList } from "./animation-list.ts";
import { animationSave } from "./animation-save.ts";
import { assetAdd } from "./asset-add.ts";
import { assetDelete } from "./asset-delete.ts";
import { assetRename } from "./asset-rename.ts";
import { componentList } from "./component-list.ts";
import { elementAdd } from "./element-add.ts";
import { elementGroup } from "./element-group.ts";
import { elementMove } from "./element-move.ts";
import { elementRemove } from "./element-remove.ts";
import { elementUngroup } from "./element-ungroup.ts";
import { elementUpdate } from "./element-update.ts";
import { fontInstall } from "./font-install.ts";
import { fontList } from "./font-list.ts";
import { imageTrim } from "./image-trim.ts";
import { keyframeRemove } from "./keyframe-remove.ts";
import { keyframeSet } from "./keyframe-set.ts";
import { presetDelete } from "./preset-delete.ts";
import { presetGet } from "./preset-get.ts";
import { presetList } from "./preset-list.ts";
import { presetRename } from "./preset-rename.ts";
import { presetSave } from "./preset-save.ts";
import { presetValidate } from "./preset-validate.ts";
import { projectCreate } from "./project-create.ts";
import { projectDelete } from "./project-delete.ts";
import { projectInspect } from "./project-inspect.ts";
import { projectList } from "./project-list.ts";
import { projectUpdate } from "./project-update.ts";
import { sceneExport } from "./scene-export.ts";
import { sceneGenerateSpeech } from "./scene-generate-speech.ts";
import { sceneInspectLayout } from "./scene-inspect-layout.ts";
import { scenePreview } from "./scene-preview.ts";
import { shotSet } from "./shot-set.ts";

const TOOLS: readonly Tool[] = [
  componentList,
  presetList,
  presetGet,
  presetValidate,
  presetSave,
  presetRename,
  presetDelete,
  animationList,
  animationSave,
  animationDelete,
  projectList,
  projectInspect,
  projectCreate,
  projectUpdate,
  projectDelete,
  sceneList,
  sceneGet,
  sceneCreate,
  sceneBuild,
  sceneUpdate,
  sceneRename,
  sceneDelete,
  sceneValidate,
  scenePreview,
  sceneExport,
  sceneInspectLayout,
  elementAdd,
  elementUpdate,
  elementRemove,
  elementMove,
  elementGroup,
  elementUngroup,
  imageTrim,
  assetAdd,
  assetRename,
  assetDelete,
  backgroundSet,
  keyframeSet,
  keyframeRemove,
  shotSet,
  sceneGenerateSpeech,
  fontList,
  fontInstall,
];

export const registry = createRegistry(TOOLS);
