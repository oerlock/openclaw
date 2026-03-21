import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";

type FetchUrlParams = {
  url: string;
  wait_for_render?: number;
  screenshot_path?: string;
};

type PluginConfig = {
  mcpUrl?: string;
};

const DEFAULT_MCP_URL = "http://localhost:8931/mcp";
const DEFAULT_WAIT_SECONDS = 8;
const MAX_WAIT_SECONDS = 60;

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readParams(input: unknown): FetchUrlParams {
  if (!isRecord(input)) {
    fail("params required");
  }

  const { url, wait_for_render, screenshot_path } = input;
  if (typeof url !== "string" || !url.trim()) {
    fail("url is required");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    fail("url must be a valid absolute URL");
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    fail("url must use http or https");
  }

  const waitSeconds =
    wait_for_render === undefined ? DEFAULT_WAIT_SECONDS : Number(wait_for_render);
  if (!Number.isFinite(waitSeconds) || waitSeconds < 0 || waitSeconds >= MAX_WAIT_SECONDS + 1) {
    fail("wait_for_render must be between 0 and 60 seconds");
  }

  if (screenshot_path !== undefined && typeof screenshot_path !== "string") {
    fail("screenshot_path must be a string path");
  }
  if (typeof screenshot_path === "string" && !screenshot_path.trim()) {
    fail("screenshot_path must not be empty");
  }

  return {
    url: parsedUrl.toString(),
    wait_for_render: waitSeconds,
    screenshot_path: screenshot_path?.trim() || undefined,
  };
}

function extractImageBase64(result: CallToolResult): string {
  const blocks = Array.isArray(result.content) ? result.content : [];
  for (const block of blocks) {
    if (!isRecord(block)) {
      continue;
    }
    if (typeof block.data === "string" && block.data.trim()) {
      return block.data;
    }
  }
  fail("browser_take_screenshot did not return image data");
}

function resultToJson(result: CallToolResult): string {
  return JSON.stringify(
    {
      content: result.content ?? [],
      structuredContent: result.structuredContent ?? null,
      isError: result.isError === true,
    },
    null,
    2,
  );
}

async function callBrowserTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  return (await client.callTool({
    name,
    arguments: args,
  })) as CallToolResult;
}

export function createFetchUrlTool(options?: PluginConfig): AnyAgentTool {
  const mcpUrl = options?.mcpUrl?.trim() || DEFAULT_MCP_URL;

  return {
    name: "fetch_url",
    description: "使用无头浏览器获取指定 URL 的最终渲染网页内容，并可按需保存整页截图。",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "要抓取的 HTTP/HTTPS URL。",
        },
        wait_for_render: {
          type: "number",
          description: "等待页面渲染的时间（秒），默认 8，范围 0 到 60。",
          minimum: 0,
          maximum: 60,
        },
        screenshot_path: {
          type: "string",
          description: "可选截图保存路径，例如 /tmp/page.png。",
        },
      },
      required: ["url"],
      additionalProperties: false,
    },
    async execute(_id, params) {
      let client: Client | undefined;
      let transport: StreamableHTTPClientTransport | undefined;

      try {
        const input = readParams(params);
        transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
        client = new Client(
          {
            name: "openclaw-fetch-url-plugin",
            version: "0.0.0",
          },
          {},
        );
        await client.connect(transport);

        await callBrowserTool(client, "browser_navigate", {
          url: input.url,
        });

        if ((input.wait_for_render ?? 0) > 0) {
          await callBrowserTool(client, "browser_wait_for", {
            time: input.wait_for_render,
          });
        }

        const snapshot = await callBrowserTool(client, "browser_snapshot", {});

        if (input.screenshot_path) {
          const screenshotResult = await callBrowserTool(client, "browser_take_screenshot", {
            type: "png",
            filename: "screenshot.png",
            fullPage: true,
          });
          const imageData = extractImageBase64(screenshotResult);
          await fs.writeFile(input.screenshot_path, Buffer.from(imageData, "base64"));
        }

        const output = resultToJson(snapshot);
        const details: Record<string, unknown> = {
          url: input.url,
          wait_for_render: input.wait_for_render,
          mcpUrl,
        };
        if (input.screenshot_path) {
          details.screenshot_path = input.screenshot_path;
        }

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
          details,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "fetch_url failed",
            },
          ],
          isError: true,
        };
      } finally {
        await client?.close().catch(() => {});
        await transport?.close().catch(() => {});
      }
    },
  };
}

export default definePluginEntry({
  id: "fetch-url",
  name: "Fetch URL Plugin",
  description: "Fetch rendered HTML snapshots through a browser MCP server.",
  register(api) {
    const cfg = (api.pluginConfig ?? {}) as PluginConfig;
    api.registerTool(createFetchUrlTool(cfg) as AnyAgentTool);
  },
});
