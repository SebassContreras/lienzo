/**
 * Every tool, one file each (A20); the CLI (008) and the MCP server (009) expose `registry`.
 * A new tool is a file here plus one line in `TOOLS`.
 */

import { assetAdd } from "../assets/tools/asset-add.ts";
import { assetDelete } from "../assets/tools/asset-delete.ts";
import { assetRename } from "../assets/tools/asset-rename.ts";
import { imageTrim } from "../assets/tools/image-trim.ts";
import { componentList } from "../elements/tools/component-list.ts";
import { elementAdd } from "../elements/tools/element-add.ts";
import { elementGroup } from "../elements/tools/element-group.ts";
import { elementMove } from "../elements/tools/element-move.ts";
import { elementRemove } from "../elements/tools/element-remove.ts";
import { elementUngroup } from "../elements/tools/element-ungroup.ts";
import { elementUpdate } from "../elements/tools/element-update.ts";
import { fontInstall } from "../fonts/tools/font-install.ts";
import { fontList } from "../fonts/tools/font-list.ts";
import { animationDelete } from "../presets/tools/animation-delete.ts";
import { animationList } from "../presets/tools/animation-list.ts";
import { animationSave } from "../presets/tools/animation-save.ts";
import { presetDelete } from "../presets/tools/preset-delete.ts";
import { presetGet } from "../presets/tools/preset-get.ts";
import { presetList } from "../presets/tools/preset-list.ts";
import { presetRename } from "../presets/tools/preset-rename.ts";
import { presetSave } from "../presets/tools/preset-save.ts";
import { presetValidate } from "../presets/tools/preset-validate.ts";
import { projectCreate } from "../projects/tools/project-create.ts";
import { projectDelete } from "../projects/tools/project-delete.ts";
import { projectInspect } from "../projects/tools/project-inspect.ts";
import { projectList } from "../projects/tools/project-list.ts";
import { projectUpdate } from "../projects/tools/project-update.ts";
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
import { keyframeRemove } from "../shots/tools/keyframe-remove.ts";
import { keyframeSet } from "../shots/tools/keyframe-set.ts";
import { shotSet } from "../shots/tools/shot-set.ts";
import { sceneExport } from "./scene-export.ts";
import { sceneGenerateSpeech } from "./scene-generate-speech.ts";
import { sceneInspectLayout } from "./scene-inspect-layout.ts";
import { scenePreview } from "./scene-preview.ts";

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
