// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { BrandManagerDialog } from "./brand-manager-dialog.tsx";

type Call = { url: string; method: string; body?: unknown };

/** The project API: answers by method and URL; `fail` makes the next write fail. */
let calls: Call[] = [];
let fail: { status: number; error?: string } | undefined;
function projectApi(url: string, init: RequestInit = {}) {
  const method = init.method ?? "GET";
  calls.push({
    url,
    method,
    body: init.body ? JSON.parse(init.body as string) : undefined,
  });
  if (method !== "GET" && fail) {
    return Promise.resolve(
      new Response(JSON.stringify(fail.error ? { error: fail.error } : {}), {
        status: fail.status,
      }),
    );
  }
  if (url === "/api/projects/acme") {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          manifest: {
            name: "Acme",
            description: "Marca",
            palette: { primary: "#ff0000" },
            canvas: { width: 1920, height: 1080, fps: 60, duration: 8 },
          },
          assets: ["logo.png"],
        }),
      ),
    );
  }
  return Promise.resolve(new Response("[]"));
}

function dialog(mode: "create" | "edit", initialSlug?: string) {
  const props = {
    onClose: vi.fn(),
    onProjectSaved: vi.fn(),
    onProjectDeleted: vi.fn(),
    setStatus: vi.fn(),
  };
  render(
    <BrandManagerDialog
      isOpen
      mode={mode}
      initialSlug={initialSlug}
      {...props}
    />,
  );
  return props;
}

const field = (label: RegExp) =>
  screen.getByLabelText(label) as HTMLInputElement;
const writes = () => calls.filter((c) => c.method !== "GET");

beforeAll(() => {
  // jsdom has no modal dialogs
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
beforeEach(() => {
  calls = [];
  fail = undefined;
  vi.stubGlobal("fetch", vi.fn(projectApi));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BrandManagerDialog", () => {
  it("creates a project whose slug follows the name, with its canvas", async () => {
    const { onProjectSaved, onClose, setStatus } = dialog("create");
    fireEvent.change(field(/Nombre del Proyecto/), {
      target: { value: "Caja Ámbar" },
    });
    expect(field(/Identificador/).value).toBe("caja-ambar");
    fireEvent.click(screen.getByText("Lienzo"));
    fireEvent.change(field(/Ancho/), { target: { value: "1920" } });
    fireEvent.click(screen.getByText("Crear Proyecto"));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    const [post] = writes();
    expect(post).toMatchObject({
      url: "/api/projects?slug=caja-ambar",
      method: "POST",
      body: {
        name: "Caja Ámbar",
        canvas: { width: 1920, height: 1080, fps: 30, duration: 5 },
        fonts: [],
      },
    });
    expect(onProjectSaved).toHaveBeenCalledWith(
      "caja-ambar",
      expect.objectContaining({ primary: "#3b82f6" }),
      expect.objectContaining({ width: 1920 }),
    );
    expect(setStatus).toHaveBeenCalledWith(
      "Proyecto «Caja Ámbar» creado exitosamente",
    );
  });

  it("a slug typed by hand stops following the name", () => {
    dialog("create");
    fireEvent.change(field(/Identificador/), { target: { value: "Mi-Marca" } });
    fireEvent.change(field(/Nombre del Proyecto/), {
      target: { value: "Otra cosa" },
    });
    expect(field(/Identificador/).value).toBe("mi-marca");
  });

  it("refuses an empty name or a bad slug without calling the server", async () => {
    dialog("create");
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    await screen.findByText("El nombre del proyecto es obligatorio");

    fireEvent.change(field(/Nombre del Proyecto/), { target: { value: "A" } });
    fireEvent.change(field(/Identificador/), { target: { value: "a b!" } });
    fireEvent.submit(form);
    await screen.findByText(/El identificador \(slug\) debe contener/);
    expect(writes()).toEqual([]);
  });

  it("shows the server's error and stays open", async () => {
    fail = { status: 409, error: "Ya existe un proyecto con ese nombre" };
    const { onClose } = dialog("create");
    fireEvent.change(field(/Nombre del Proyecto/), {
      target: { value: "Acme" },
    });
    fireEvent.click(screen.getByText("Crear Proyecto"));
    await screen.findByText("Ya existe un proyecto con ese nombre");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("edits a project: loads it, and saves its changes with PATCH", async () => {
    const { onProjectSaved } = dialog("edit", "acme");
    await vi.waitFor(() =>
      expect(field(/Nombre del Proyecto/).value).toBe("Acme"),
    );
    expect(screen.getByText("Recursos (1)")).toBeTruthy();
    fireEvent.change(field(/Nombre del Proyecto/), {
      target: { value: "Acme 2" },
    });
    // the slug of a saved project does not follow its name
    expect(field(/Identificador/).value).toBe("acme");
    fireEvent.click(screen.getByText("Guardar Cambios"));
    await vi.waitFor(() => expect(onProjectSaved).toHaveBeenCalled());
    expect(writes()).toEqual([
      {
        url: "/api/projects/acme",
        method: "PATCH",
        body: {
          name: "Acme 2",
          description: "Marca",
          palette: { primary: "#ff0000" },
          canvas: { width: 1920, height: 1080, fps: 60, duration: 8 },
        },
      },
    ]);
  });

  it("deletes a project only after confirming", async () => {
    const { onProjectDeleted } = dialog("edit", "acme");
    fireEvent.click(await screen.findByText("Eliminar proyecto"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(writes()).toEqual([]);

    fireEvent.click(screen.getByText("Eliminar proyecto"));
    fireEvent.click(screen.getByText("Sí, eliminar"));
    await vi.waitFor(() =>
      expect(onProjectDeleted).toHaveBeenCalledWith("acme"),
    );
    expect(writes()).toEqual([{ url: "/api/projects/acme", method: "DELETE" }]);
  });

  it("a project that cannot be loaded says so", async () => {
    vi.stubGlobal("fetch", async () => new Response("", { status: 404 }));
    dialog("edit", "nope");
    await screen.findByText("No se pudo cargar la información del proyecto");
  });
});
