import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFetchUrlTool } from "./index.js";

const connectMock = vi.fn();
const closeMock = vi.fn().mockResolvedValue(undefined);
const transportCloseMock = vi.fn().mockResolvedValue(undefined);
const callToolMock = vi.fn();

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: class MockClient {
    connect = connectMock;
    callTool = callToolMock;
    close = closeMock;
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: class MockTransport {
    constructor(public readonly url: URL) {}
    close = transportCloseMock;
  },
}));

describe("fetch_url", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the browser snapshot JSON", async () => {
    callToolMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "<html>ok</html>" }],
        structuredContent: { title: "Example" },
      });

    const tool = createFetchUrlTool({ mcpUrl: "http://localhost:8931/mcp" });
    const result = await tool.execute("call", { url: "https://example.com" });

    expect(result.isError).not.toBe(true);
    expect(connectMock).toHaveBeenCalledOnce();
    expect(callToolMock).toHaveBeenNthCalledWith(1, {
      name: "browser_navigate",
      arguments: { url: "https://example.com" },
    });
    expect(callToolMock).toHaveBeenNthCalledWith(2, {
      name: "browser_wait_for",
      arguments: { time: 8 },
    });
    expect(callToolMock).toHaveBeenNthCalledWith(3, {
      name: "browser_snapshot",
      arguments: {},
    });
    expect(result.content[0]?.text).toContain('"title":"Example"');
  });

  it("writes screenshot data when screenshot_path is provided", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fetch-url-plugin-"));
    const screenshotPath = path.join(dir, "page.png");

    callToolMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ content: [{ type: "text", text: "snapshot" }] })
      .mockResolvedValueOnce({
        content: [{ type: "image", data: Buffer.from("png").toString("base64") }],
      });

    const tool = createFetchUrlTool();
    const result = await tool.execute("call", {
      url: "https://example.com",
      screenshot_path: screenshotPath,
      wait_for_render: 0,
    });

    expect(result.isError).not.toBe(true);
    expect(callToolMock).toHaveBeenNthCalledWith(3, {
      name: "browser_take_screenshot",
      arguments: { type: "png", filename: "screenshot.png", fullPage: true },
    });
    await expect(fs.readFile(screenshotPath, "utf8")).resolves.toBe("png");
  });

  it("rejects invalid wait_for_render values", async () => {
    const tool = createFetchUrlTool();
    const result = await tool.execute("call", {
      url: "https://example.com",
      wait_for_render: 61,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("expected number to be <=60");
    expect(callToolMock).not.toHaveBeenCalled();
  });
});
