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
  Search,
  Unlock,
} from "lucide-react";
import { type DragEvent, useEffect, useRef, useState } from "react";
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

/** A row is selected by click or by Enter/Space; both carry the modifier keys. */
type RowEvent = React.MouseEvent | React.KeyboardEvent;

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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedShots, setCollapsedShots] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-expand shot groups and scroll into view when an element is selected (055/R6, D6)
  useEffect(() => {
    if (selection.length === 0) return;
    const selectedId = selection[0];
    const targetEl = scene.elements.find((e) => e.id === selectedId);
    if (targetEl?.shot && collapsedShots.has(targetEl.shot)) {
      setCollapsedShots((prev) => {
        const next = new Set(prev);
        next.delete(targetEl.shot as string);
        return next;
      });
    }

    // Scroll to the selected layer item
    requestAnimationFrame(() => {
      const selectedDom = panelRef.current?.querySelector(
        `[data-element-id="${selectedId}"]`,
      );
      selectedDom?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [selection, scene.elements, collapsedShots]);

  const visualElements = visualLayerOrder(scene.elements);

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleShotCollapse = (shotId: string) => {
    setCollapsedShots((prev) => {
      const next = new Set(prev);
      if (next.has(shotId)) next.delete(shotId);
      else next.add(shotId);
      return next;
    });
  };

  const handleRowClick = (e: RowEvent, id: string) => {
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
    const fromArrayIdx = visualIndexToArrayIndex(
      draggedIndex,
      scene.elements.length,
    );
    const toArrayIdx = visualIndexToArrayIndex(
      targetVisualIdx,
      scene.elements.length,
    );
    const updated = reorderElements(scene.elements, fromArrayIdx, toArrayIdx);
    setDraggedIndex(null);
    onChangeScene({ ...scene, elements: updated });
  };

  const query = filterText.trim().toLowerCase();
  const matchesFilter = (el: Element): boolean => {
    if (!query) return true;
    if (el.name?.toLowerCase().includes(query)) return true;
    if (el.id?.toLowerCase().includes(query)) return true;
    if (el.kind === "group" && Array.isArray((el as GroupEl).children)) {
      return (el as GroupEl).children.some(matchesFilter);
    }
    return false;
  };

  const filteredElements = visualElements.filter(matchesFilter);

  // Group elements by shot if the scene has shots defined (055/R6)
  const hasShots = scene.shots && scene.shots.length > 0;

  return (
    <div className="layers-panel" ref={panelRef}>
      <div
        className="layers-header"
        style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="layers-title">Capas ({scene.elements.length})</span>
        </div>
        <div
          className="layer-search-box"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--panel-2)",
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid var(--line)",
          }}
        >
          <Search size={12} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar capas..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: 12,
            }}
          />
        </div>
      </div>
      <div className="layers-list" role="tree">
        {filteredElements.length === 0 ? (
          <div className="layers-empty">
            {filterText
              ? "No se encontraron capas."
              : "No hay capas en el lienzo."}
          </div>
        ) : hasShots ? (
          // Grouped by shots
          (() => {
            const shotGroups = new Map<string | null, Element[]>();
            // Init shots in order
            for (const sh of scene.shots ?? []) {
              shotGroups.set(sh.id, []);
            }
            shotGroups.set(null, []); // Global elements without shot

            for (const el of filteredElements) {
              const sid = el.shot && shotGroups.has(el.shot) ? el.shot : null;
              shotGroups.get(sid)?.push(el);
            }

            return Array.from(shotGroups.entries()).map(
              ([shotId, elements]) => {
                if (elements.length === 0 && shotId === null) return null;
                const shotObj = scene.shots?.find((s) => s.id === shotId);
                const label = shotObj
                  ? `Toma: ${shotObj.name} (${shotObj.start}s - ${shotObj.end}s)`
                  : "Global / Sin toma";
                const isCollapsed = shotId ? collapsedShots.has(shotId) : false;

                return (
                  <div
                    key={shotId ?? "__global"}
                    className="shot-layers-section"
                    style={{ marginBottom: 6 }}
                  >
                    <button
                      type="button"
                      className="shot-header-row"
                      disabled={!shotId}
                      onClick={() => shotId && toggleShotCollapse(shotId)}
                      style={{
                        display: "flex",
                        width: "100%",
                        border: "none",
                        font: "inherit",
                        textAlign: "left",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 8px",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderBottom: "1px solid var(--line)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--muted)",
                        cursor: shotId ? "pointer" : "default",
                        userSelect: "none",
                      }}
                    >
                      {shotId &&
                        (isCollapsed ? (
                          <ChevronRight size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        ))}
                      <span>{label}</span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 10,
                          opacity: 0.7,
                        }}
                      >
                        {elements.length}
                      </span>
                    </button>
                    {!isCollapsed &&
                      elements.map((el, visualIdx) => (
                        <LayerItem
                          key={el.id}
                          element={el}
                          depth={0}
                          visualIndex={visualIdx}
                          totalCount={elements.length}
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
                      ))}
                  </div>
                );
              },
            );
          })()
        ) : (
          filteredElements.map((el, visualIdx) => (
            <LayerItem
              key={el.id}
              element={el}
              depth={0}
              visualIndex={visualIdx}
              totalCount={filteredElements.length}
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
  onClick: (e: RowEvent) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onMove: (dir: LayerDirection) => void;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  selection: string[];
  onChildSelect: (e: RowEvent, id: string) => void;
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
        data-element-id={element.id}
        className={`layer-row ${isSelected ? "selected" : ""} ${element.hidden ? "hidden-layer" : ""} ${
          element.locked ? "locked-layer" : ""
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        draggable={depth === 0}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e);
          }
        }}
        role="treeitem"
        tabIndex={0}
        aria-selected={isSelected}
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
            {isCollapsed ? (
              <ChevronRight size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>
        )}
        <div className="layer-icon" aria-hidden="true">
          {isGroup ? (
            isCollapsed ? (
              <Folder size={14} />
            ) : (
              <FolderOpen size={14} />
            )
          ) : (
            <IconSvg name={iconName} size={14} />
          )}
        </div>
        <span className="layer-name">
          {element.name || desc?.label || element.kind}
        </span>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: only stops the row's click; the buttons inside are the controls */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: same as above, nothing here is clickable by itself */}
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
