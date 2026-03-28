import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCreateVideoGenTaskTool, createGetVideoGenResultTool } from "./index.js";

describe("video_generator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates async video task", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: {
          task_id: "task-123",
          task_status: "PENDING",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createCreateVideoGenTaskTool({
      apiKey: "test-key",
      createTaskUrl: "https://api.example/create",
    });

    const result = await tool.execute("call", {
      model: "wan2.6-i2v-flash",
      input_: {
        prompt: "让猫在雪地中奔跑",
        img_url: "https://img.example/first-frame.png",
        template: "cinematic-pan",
      },
      parameters: {
        resolution: "720P",
        duration: 5,
        audio: true,
      },
    });

    expect(result.isError).not.toBe(true);
    expect(result.content[0]?.text).toContain("task-123");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      "X-DashScope-Async": "enable",
    });
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("cinematic-pan");
  });

  it("queries task result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: {
          video_url: "https://video.example/final.mp4",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createGetVideoGenResultTool({
      apiKey: "test-key",
      taskResultBaseUrl: "https://api.example/tasks",
    });

    const result = await tool.execute("call", {
      task_id: "task-123",
    });

    expect(result.isError).not.toBe(true);
    expect(result.content[0]?.text).toContain("final.mp4");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example/tasks/task-123");
  });

  it("validates input url", async () => {
    const tool = createCreateVideoGenTaskTool({ apiKey: "test-key" });

    const result = await tool.execute("call", {
      model: "wan2.6-i2v-flash",
      input_: {
        img_url: "file:///tmp/x.png",
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("must be HTTP/HTTPS/OSS/Base64 data");
  });

  it("validates model", async () => {
    const tool = createCreateVideoGenTaskTool({ apiKey: "test-key" });

    const result = await tool.execute("call", {
      model: "wan2.5-i2v",
      input_: {
        img_url: "https://img.example/first-frame.png",
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("only supports wan2.6-i2v-flash");
  });

  it("requires apiKey", async () => {
    const tool = createGetVideoGenResultTool();

    const result = await tool.execute("call", {
      task_id: "task-123",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("pluginConfig.apiKey is not set");
  });
});
