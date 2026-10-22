# 043 — scenes-sidebar-tab — Requirements

Scenes are opened from a modal reached by a top-bar button, while everything else that belongs
to a project (library, layers, assets, presets) lives in the left sidebar tabs. Move scenes there.

- R1@1: The left sidebar has an "Escenas" tab next to Biblioteca, Capas, Recursos and Presets, with the same look and behaviour as those tabs.
- R2@1: The tab lists the scenes of the active project (`projects/<slug>/scenes/`) with a thumbnail and lets the user open, save the current scene, save as, rename, duplicate, delete, import and export JSON.
- R3@1: The tab offers "Escena en blanco", and "Recuperar borrador" (the workspace autosave, 042); there is no demo entry (042/R4).
- R4@1: The top-bar scene button, its modal dialog (`SceneFiles`), the top-bar "Demo" and "Escena en blanco" buttons, and every reference to them are removed.
- R5@1: Switching project refreshes the tab's list to the new project's scenes.
