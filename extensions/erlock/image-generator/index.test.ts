import { beforeEach, describe, expect, it, vi } from "vitest";
import { createImageGeneratorTool } from "./index.js";

describe("image_generator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns image URLs from DashScope response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: {
          choices: [
            {
              message: {
                content: [{ image: "https://img.example/generated.png" }],
              },
            },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createImageGeneratorTool({ apiKey: "test-key", baseUrl: "https://api.example" });
    const result = await tool.execute("call", {
      model: "qwen-image-2.0",
      input_: {
        messages: [
          {
            role: "user",
            content: [{ text: "一只会弹钢琴的猫" }],
          },
        ],
      },
      parameters: { n: 1, watermark: false },
    });

    expect(result.isError).not.toBe(true);
    expect(result.content[0]?.text).toContain("https://img.example/generated.png");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("qwen-image-2.0");
  });

  it("supports image plus text input with JSON string parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: {
          choices: [
            {
              message: {
                content: [{ image: "https://img.example/edited.png" }],
              },
            },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createImageGeneratorTool({ apiKey: "test-key", baseUrl: "https://api.example" });
    const result = await tool.execute("call", {
      model: "qwen-image-2.0-pro",
      input_: {
        messages: [
          {
            role: "user",
            content: [{ image: "https://img.example/ref.png" }, { text: "让人物站在海边" }],
          },
        ],
      },
      parameters: '{"size":"1024*1536","prompt_extend":true}',
    });

    expect(result.isError).not.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("1024*1536");
  });

  it("rejects invalid image content rules", async () => {
    const tool = createImageGeneratorTool({ apiKey: "test-key" });
    const result = await tool.execute("call", {
      model: "qwen-image-2.0",
      input_: {
        messages: [
          {
            role: "user",
            content: [{ image: "file:///tmp/a.png" }, { image: "https://img.example/b.png" }],
          },
        ],
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("must be HTTP/HTTPS/OSS/Base64 data");
  });

  it("rejects invalid size range", async () => {
    const tool = createImageGeneratorTool({ apiKey: "test-key" });
    const result = await tool.execute("call", {
      model: "qwen-image-2.0",
      input_: {
        messages: [
          {
            role: "user",
            content: [{ text: "a castle" }],
          },
        ],
      },
      parameters: { size: "256*1024" },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("width must be between 512 and 2048");
  });

  it("requires pluginConfig.apiKey", async () => {
    const tool = createImageGeneratorTool();
    const result = await tool.execute("call", {
      model: "qwen-image-2.0",
      input_: {
        messages: [
          {
            role: "user",
            content: [{ text: "a castle" }],
          },
        ],
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("pluginConfig.apiKey is required");
  });
});
