import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCreateReferenceVideoTaskTool, createGetReferenceVideoResultTool } from "./index.js";

describe("reference_video_generator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates async reference-video task", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: {
          task_id: "task-r2v-123",
          task_status: "PENDING",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createCreateReferenceVideoTaskTool({
      apiKey: "test-key",
      createTaskUrl: "https://api.example/create",
    });

    const result = await tool.execute("call", {
      model: "wan2.6-r2v-flash",
      input_: {
        prompt: "character1在海边奔跑，character2在后面追逐",
        reference_urls: [
          "https://assets.example/character1.mp4",
          "https://assets.example/character2.png",
        ],
      },
      parameters: {
        size: "1280*720",
        duration: 5,
        shot_type: "multi",
        audio: false,
      },
    });

    expect(result.isError).not.toBe(true);
    expect(result.content[0]?.text).toContain("task-r2v-123");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      "X-DashScope-Async": "enable",
    });
  });

  it("queries task result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output: {
          task_status: "SUCCEEDED",
          video_url: "https://video.example/final.mp4",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tool = createGetReferenceVideoResultTool({
      apiKey: "test-key",
      taskResultBaseUrl: "https://api.example/tasks",
    });

    const result = await tool.execute("call", {
      task_id: "task-r2v-123",
    });

    expect(result.isError).not.toBe(true);
    expect(result.content[0]?.text).toContain("final.mp4");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example/tasks/task-r2v-123");
  });

  it("rejects unsupported model", async () => {
    const tool = createCreateReferenceVideoTaskTool({ apiKey: "test-key" });

    const result = await tool.execute("call", {
      model: "wan2.6-i2v-flash",
      input_: {
        prompt: "character1挥手",
        reference_urls: ["https://assets.example/char1.mp4"],
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("only supports wan2.6-r2v-flash or wan2.6-r2v");
  });

  it("rejects too many video references", async () => {
    const tool = createCreateReferenceVideoTaskTool({ apiKey: "test-key" });

    const result = await tool.execute("call", {
      model: "wan2.6-r2v-flash",
      input_: {
        prompt: "character1和character2说话",
        reference_urls: [
          "https://assets.example/a.mp4",
          "https://assets.example/b.mov",
          "https://assets.example/c.mp4",
          "https://assets.example/d.mov",
        ],
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("at most 3 video URLs");
  });

  it("requires apiKey", async () => {
    const tool = createGetReferenceVideoResultTool();

    const result = await tool.execute("call", {
      task_id: "task-r2v-123",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("pluginConfig.apiKey is not set");
  });
});
