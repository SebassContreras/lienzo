// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageEl } from "../../components/image/descriptor.ts";
import { createElement } from "../../components/index.ts";
import { ImageCropTools } from "./image-crop.tsx";

const imagePixels = vi.fn();
vi.mock("../../engine/image-pixels.ts", () => ({
  imagePixels: (src: string) => imagePixels(src),
}));

afterEach(cleanup);

describe("ImageCropTools", () => {
  const image = (over: Partial<ImageEl> = {}): ImageEl => ({
    ...(createElement("image") as ImageEl),
    src: "logo.png",
    x: 0,
    y: 0,
    w: 400,
    h: 400,
    aspect: 1,
    ...over,
  });

  beforeEach(() => imagePixels.mockReset());

  it("trims to the visible pixels", async () => {
    // 2×2 picture, only the top-left pixel visible
    const data = new Uint8ClampedArray(16);
    data[3] = 255;
    imagePixels.mockResolvedValue({ data, width: 2, height: 2 });
    const onChange = vi.fn();
    render(<ImageCropTools el={image()} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Recortar transparencia/));
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange.mock.calls[0][0]).toMatchObject({
      crop: { x: 0, y: 0, w: 0.5, h: 0.5 },
      w: 200,
      h: 200,
    });
  });

  it("says so when the picture is fully transparent or cannot be read", async () => {
    imagePixels.mockResolvedValueOnce({
      data: new Uint8ClampedArray(16),
      width: 2,
      height: 2,
    });
    const onChange = vi.fn();
    render(<ImageCropTools el={image()} onChange={onChange} />);
    fireEvent.click(screen.getByText(/Recortar transparencia/));
    await screen.findByText(/La imagen es transparente/);

    imagePixels.mockRejectedValueOnce(new Error("404"));
    fireEvent.click(screen.getByText(/Recortar transparencia/));
    await screen.findByText("No se pudo leer la imagen.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("offers to remove a crop only when there is one", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ImageCropTools el={image()} onChange={onChange} />,
    );
    expect(screen.queryByText(/Quitar recorte/)).toBeNull();
    rerender(
      <ImageCropTools
        el={image({
          crop: { x: 0.5, y: 0, w: 0.5, h: 1 },
          w: 200,
          aspect: 0.5,
        })}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText(/Quitar recorte/));
    expect(onChange.mock.calls[0][0]).toMatchObject({
      crop: { x: 0, y: 0, w: 1, h: 1 },
      w: 400,
    });
  });

  it("shows nothing for an image without a source", () => {
    const { container } = render(
      <ImageCropTools el={image({ src: "" })} onChange={() => {}} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
