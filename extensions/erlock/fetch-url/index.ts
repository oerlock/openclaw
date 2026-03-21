import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { z } from "zod";

const DEFAULT_MCP_URL = "http://localhost:8931/mcp";

export const FetchUrlArgs = z.object({
  url: z.url(),
  wait_for_render: z.number().min(0).max(60).default(8),
  screenshot_path: z.string().trim().min(1).optional(),
});

export type FetchUrlArgsType = z.infer<typeof FetchUrlArgs>;

type PluginConfig = {
  mcpUrl?: string;
};

function getScreenshotData(result: CallToolResult): string | undefined {
  return result.content?.find(
    (item): item is { data: string } =>
      Boolean(item) && typeof item === "object" && typeof item.data === "string",
  )?.data;
}

async function callTool(
  client: Client,
  name: string,
  arguments_: Record<string, unknown>,
): Promise<CallToolResult> {
  return (await client.callTool({ name, arguments: arguments_ })) as CallToolResult;
}

/** 使用无头浏览器获取指定 URL 的完整网页内容。 */
export async function fetchUrl(args: FetchUrlArgsType, options?: PluginConfig): Promise<string> {
  const transport = new StreamableHTTPClientTransport(new URL(options?.mcpUrl || DEFAULT_MCP_URL));
  const client = new Client({ name: "openclaw-fetch-url-plugin", version: "0.0.0" }, {});

  try {
    await client.connect(transport);

    await callTool(client, "browser_navigate", { url: args.url });

    if (args.wait_for_render) {
      await callTool(client, "browser_wait_for", { time: args.wait_for_render });
    }

    const snapshot = await callTool(client, "browser_snapshot", {});

    if (args.screenshot_path) {
      const screenshot = await callTool(client, "browser_take_screenshot", {
        type: "png",
        filename: "screenshot.png",
        fullPage: true,
      });
      const data = getScreenshotData(screenshot);
      if (data) {
        await fs.writeFile(path.resolve(args.screenshot_path), Buffer.from(data, "base64"));
      }
    }

    return JSON.stringify(snapshot);
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

export function createFetchUrlTool(options?: PluginConfig): AnyAgentTool {
  return {
    name: "fetch_url",
    description: "使用无头浏览器获取指定 URL 的最终渲染网页内容，并可按需保存整页截图。",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "要抓取的 HTTP/HTTPS URL。" },
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
      const parsed = FetchUrlArgs.safeParse(params);
      if (!parsed.success) {
        return {
          content: [{ type: "text", text: z.prettifyError(parsed.error) }],
          isError: true,
        };
      }

      try {
        return {
          content: [{ type: "text", text: await fetchUrl(parsed.data, options) }],
          details: {
            url: parsed.data.url,
            wait_for_render: parsed.data.wait_for_render,
            screenshot_path: parsed.data.screenshot_path,
            mcpUrl: options?.mcpUrl?.trim() || DEFAULT_MCP_URL,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.stack || error.message : String(error),
            },
          ],
          isError: true,
        };
      }
    },
  };
}

export default definePluginEntry({
  id: "fetch-url",
  name: "Fetch URL Plugin",
  description: "Fetch rendered HTML snapshots through a browser MCP server.",
  register(api) {
    api.registerTool(createFetchUrlTool((api.pluginConfig ?? {}) as PluginConfig) as AnyAgentTool);
  },
});
