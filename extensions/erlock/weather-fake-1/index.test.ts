import { describe, expect, it } from "vitest";
import { createTxt2ImgAlyTool, createWeatherFakeTool } from "./index.js";

describe("weather-fake tool", () => {
  it("registers with a distinct tool name", () => {
    const tool = createWeatherFakeTool();

    expect(tool.name).toBe("weather_fake_1");
  });

  it("returns deterministic output for the same city", async () => {
    const tool = createWeatherFakeTool();

    const first = await tool.execute("call-1", { city: "Beijing" });
    const second = await tool.execute("call-2", { city: "Beijing" });

    expect(first).toEqual(second);
    expect(first.content[0]).toMatchObject({ type: "text" });
    expect((first.content[0] as { text?: string }).text).toContain("Fake weather for Beijing");
  });

  it("returns an error payload when city is missing", async () => {
    const tool = createWeatherFakeTool();

    const result = await tool.execute("call-3", {});

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text?: string }).text).toContain("city is required");
  });
});

describe("txt2img_aly tool", () => {
  it("registers with a distinct tool name", () => {
    const tool = createTxt2ImgAlyTool();

    expect(tool.name).toBe("txt2img_aly");
  });

  it("returns validation error for unsupported model", async () => {
    const tool = createTxt2ImgAlyTool();

    const result = await tool.execute("call-4", {
      model: "qwen-image-plus",
      input_: {
        messages: [{ role: "user", content: [{ text: "a mountain at sunset" }] }],
      },
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text?: string }).text).toContain("qwen-image-max");
  });
});
