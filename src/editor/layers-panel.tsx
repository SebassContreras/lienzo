import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  Lock,
  MoveDown,
  MoveUp,
  Unlock,
} from "lucide-react";
import { type DragEvent, useState } from "react";
import { descriptorOf } from "../components/index.ts";
import {
  type LayerDirection,
  moveElementLayer,
  reorderElements,
  toggleElementLock,
  toggleElementVisibility,
  visualIndexToArrayIndex,
  visualLayerOrder,
} from "../engine/layers.ts";
import type { Element, GroupEl, Scene } from "../model/model.ts";
import { IconSvg } from "./icon-picker.tsx";

export function LayersPanel({
  scene,
  selection,
  onSelect,
  onChangeScene,
}: {
  scene: Scene;
  selection: string[];
  onSelect: (ids: string[]) => void;
  onChangeScene: (scene: Scene) => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const visualElements = visualLayerOrder(scene.elements);

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (selection.includes(id)) {
        onSelect(selection.filter((item) => item !== id));
      } else {
        onSelect([...selection, id]);
      }
    } else {
      onSelect([id]);
    }
  };

  const handleVisibility = (id: string) => {
    const updated = toggleElementVisibility(scene.elements, id);
    onChangeScene({ ...scene, elements: updated });
  };

  const handleLock = (id: string) => {
    const updated = toggleElementLock(scene.elements, id);
    onChangeScene({ ...scene, elements: updated });
  };

  const handleMove = (id: string, dir: LayerDirection) => {
    const updated = moveElementLayer(scene.elements, id, dir);
    onChangeScene({ ...scene, elements: updated });
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, visualIdx: number) => {
    setDraggedIndex(visualIdx);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, targetVisualIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetVisualIdx) {
      setDraggedIndex(null);
      return;
    }
    const fromArrayIdx = visualIndexToArrayIndex(draggedIndex, scene.elements.length);
    const toArrayIdx = visualIndexToArrayIndex(targetVisualIdx, scene.elements.length);
    const updated = reorderElements(scene.elements, fromArrayIdx, toArrayIdx);
    setDraggedIndex(null);
    onChangeScene({ ...scene, elements: updated });
  };

  return (
    <div className="layers-panel">
      <div className="layers-header">
        <span className="layers-title">Capas ({scene.elements.length})</span>
      </div>
      <div className="layers-list" role="tree">
        {visualElements.length === 0 ? (
          <div className="layers-empty">No hay capas en el lienzo.</div>
        ) : (
          visualElements.map((el, visualIdx) => (
            <LayerItem
              key={el.id}
              element={el}
              depth={0}
              visualIndex={visualIdx}
              totalCount={visualElements.length}
              isSelected={selection.includes(el.id)}
              isCollapsed={collapsedGroups.has(el.id)}
              onToggleCollapse={() => toggleGroupCollapse(el.id)}
              onClick={(e) => handleRowClick(e, el.id)}
              onToggleVisibility={() => handleVisibility(el.id)}
              onToggleLock={() => handleLock(el.id)}
              onMove={(dir) => handleMove(el.id, dir)}
              onDragStart={(e) => onDragStart(e, visualIdx)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, visualIdx)}
              selection={selection}
              onChildSelect={handleRowClick}
              onChildVisibility={handleVisibility}
              onChildLock={handleLock}
              onChildMove={handleMove}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LayerItem({
  element,
  depth,
  visualIndex,
  totalCount,
  isSelected,
  isCollapsed,
  onToggleCollapse,
  onClick,
  onToggleVisibility,
  onToggleLock,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  selection,
  onChildSelect,
  onChildVisibility,
  onChildLock,
  onChildMove,
}: {
  element: Element;
  depth: number;
  visualIndex: number;
  totalCount: number;
  isSelected: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClick: (e: React.MouseEvent) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onMove: (dir: LayerDirection) => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  selection: string[];
  onChildSelect: (e: React.MouseEvent, id: string) => void;
  onChildVisibility: (id: string) => void;
  onChildLock: (id: string) => void;
  onChildMove: (id: string, dir: LayerDirection) => void;
}) {
  const isGroup = element.kind === "group";
  const group = isGroup ? (element as GroupEl) : undefined;
  const children = group?.children as Element[] | undefined;
  const desc = descriptorOf(element.kind);
  const iconName = desc?.icon ?? "Square";

  return (
    <>
      <div
        className={`layer-row ${isSelected ? "selected" : ""} ${element.hidden ? "hidden-layer" : ""} ${
          element.locked ? "locked-layer" : ""
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        draggable={depth === 0}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        title={element.name}
      >
        {isGroup && (
          <button
            type="button"
            className="layer-collapse-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            title={isCollapsed ? "Expandir grupo" : "Colapsar grupo"}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
        <div className="layer-icon" aria-hidden="true">
          {isGroup ? (
            isCollapsed ? <Folder size={14} /> : <FolderOpen size={14} />
          ) : (
            <IconSvg name={iconName} size={14} />
          )}
        </div>
        <span className="layer-name">{element.name || desc?.label || element.kind}</span>
        <div className="layer-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`layer-action-btn ${element.hidden ? "active" : ""}`}
            title={element.hidden ? "Mostrar en lienzo" : "Ocultar en lienzo"}
            onClick={onToggleVisibility}
          >
            {element.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            type="button"
            className={`layer-action-btn ${element.locked ? "active" : ""}`}
            title={element.locked ? "Desbloquear capa" : "Bloquear capa"}
            onClick={onToggleLock}
          >
            {element.locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button
            type="button"
            className="layer-action-btn"
            disabled={visualIndex === 0}
            title="Subir nivel (hacia adelante)"
            onClick={() => onMove("up")}
          >
            <MoveUp size={13} />
          </button>
          <button
            type="button"
            className="layer-action-btn"
            disabled={visualIndex === totalCount - 1}
            title="Bajar nivel (hacia atrás)"
            onClick={() => onMove("down")}
          >
            <MoveDown size={13} />
          </button>
        </div>
      </div>
      {isGroup && !isCollapsed && children && children.length > 0 && (
        <div className="layer-children">
          {visualLayerOrder(children).map((child, childVisualIdx) => (
            <LayerItem
              key={child.id}
              element={child}
              depth={depth + 1}
              visualIndex={childVisualIdx}
              totalCount={children.length}
              isSelected={selection.includes(child.id)}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              onClick={(e) => onChildSelect(e, child.id)}
              onToggleVisibility={() => onChildVisibility(child.id)}
              onToggleLock={() => onChildLock(child.id)}
              onMove={(dir) => onChildMove(child.id, dir)}
              selection={selection}
              onChildSelect={onChildSelect}
              onChildVisibility={onChildVisibility}
              onChildLock={onChildLock}
              onChildMove={onChildMove}
            />
          ))}
        </div>
      )}
    </>
  );
}
