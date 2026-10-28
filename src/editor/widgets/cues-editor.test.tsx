// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SubtitleCue } from "../../engine/subtitles/types.ts";
import { CuesEditor } from "./cues-editor.tsx";

afterEach(cleanup);

describe("CuesEditor", () => {
  const cue = (text: string, start: number, end: number): SubtitleCue => ({
    id: "c1",
    text,
    start,
    end,
  });

  it("typing turns the text into cues from the current start", () => {
    const onChange = vi.fn();
    render(<CuesEditor cues={[cue("hola", 2, 3)]} onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "hola [1] amigos" },
    });
    const [cues] = onChange.mock.lastCall as [SubtitleCue[]];
    expect(cues[0].start).toBe(2);
    expect(cues.map((c) => c.text).join(" ")).toContain("amigos");
  });

  it("moving the start shifts every cue by the same amount", () => {
    const onChange = vi.fn();
    render(
      <CuesEditor
        cues={[cue("uno", 1, 2), { ...cue("dos", 2, 3), id: "c2" }]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "4" },
    });
    const [cues] = onChange.mock.lastCall as [SubtitleCue[]];
    expect(cues.map((c) => [c.start, c.end])).toEqual([
      [4, 5],
      [5, 6],
    ]);
  });

  it("imports an SRT file", async () => {
    const onChange = vi.fn();
    render(<CuesEditor cues={[]} onChange={onChange} />);
    const srt = "1\n00:00:01,000 --> 00:00:02,000\nhola mundo\n";
    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File([srt], "subs.srt")] },
    });
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled());
    const [cues] = onChange.mock.lastCall as [SubtitleCue[]];
    expect(cues[0].start).toBe(1);
    expect(cues.map((c) => c.text).join(" ")).toContain("hola");
  });

  it("says so when a file holds no subtitles", async () => {
    const onChange = vi.fn();
    render(<CuesEditor cues={[]} onChange={onChange} />);
    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["nada"], "subs.srt")] },
    });
    await screen.findByText(/No se encontraron subtítulos/);
    expect(onChange).not.toHaveBeenCalled();
  });
});
