import { createContext, useContext } from "react";
import type { ColorPalette } from "../model/project.ts";

export type ProjectContextType = {
  activeProjectSlug?: string;
  palette?: ColorPalette;
};

export const ProjectContext = createContext<ProjectContextType>({});

export const useProject = () => useContext(ProjectContext);
