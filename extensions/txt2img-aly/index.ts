import type { AnyAgentTool, OpenClawPluginApi } from "../../src/plugins/types.js";

type AlyParameters = {
  negative_prompt?: string;
  size?: "1664*928" | "1472*1104" | "1328*1328" | "1104*1472" | "928*1664";
  n?: 1;
  seed?: number;
};

const ALLOWED_SIZES = new Set(["1664*928", "1472*1104", "1328*1328", "1104*1472", "928*1664"]);

function fail(message: string): never {
  throw new Error(message);
}

function readPrompt(input: unknown): string {
  if (!input || typeof input !== "object") {
    fail("input_ required");
  }
  const messages = (input as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length !== 1) {
    fail("input_.messages must contain exactly one message");
  }
  const firstMessage = messages[0];
  if (!firstMessage || typeof firstMessage !== "object") {
    fail("input_.messages[0] invalid");
  }
  const role = (firstMessage as { role?: unknown }).role;
  if (role !== "user") {
    fail("input_.messages[0].role must be user");
  }
  const content = (firstMessage as { content?: unknown }).content;
  if (!Array.isArray(content) || content.length !== 1) {
    fail("input_.messages[0].content must contain exactly one item");
  }
  const item = content[0];
  const text = item && typeof item === "object" ? (item as { text?: unknown }).text : undefined;
  if (typeof text !== "string" || !text.trim()) {
    fail("input_.messages[0].content[0].text required");
  }
  if (text.length > 800) {
    fail("input_.messages[0].content[0].text must be <= 800 characters");
  }
  return text;
}

function parseParameters(raw: unknown): AlyParameters | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      fail("parameters must be a valid JSON object string");
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("parameters must be an object");
  }

  const input = parsed as Record<string, unknown>;
  const out: AlyParameters = {};

  if (input.negative_prompt !== undefined && input.negative_prompt !== null) {
    if (typeof input.negative_prompt !== "string") {
      fail("parameters.negative_prompt must be a string");
    }
    if (input.negative_prompt.length > 500) {
      fail("parameters.negative_prompt must be <= 500 characters");
    }
    out.negative_prompt = input.negative_prompt;
  }

  if (input.size !== undefined && input.size !== null) {
    if (typeof input.size !== "string" || !ALLOWED_SIZES.has(input.size)) {
      fail("parameters.size must be one of 1664*928, 1472*1104, 1328*1328, 1104*1472, 928*1664");
    }
    out.size = input.size as AlyParameters["size"];
  }

  if (input.n !== undefined && input.n !== null) {
    if (input.n !== 1) {
      fail("parameters.n only supports 1");
    }
    out.n = 1;
  }

  if (input.seed !== undefined && input.seed !== null) {
    if (typeof input.seed !== "number" || !Number.isInteger(input.seed)) {
      fail("parameters.seed must be an integer");
    }
    if (input.seed < 0 || input.seed >= 2147483648) {
      fail("parameters.seed must be in [0, 2147483647]");
    }
    out.seed = input.seed;
  }

  return out;
}

async function callAly(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  input_: Record<string, unknown>;
  parameters?: AlyParameters;
}): Promise<string[]> {
  const payload: Record<string, unknown> = {
    model: params.model,
    input: params.input_,
  };
  if (params.parameters && Object.keys(params.parameters).length > 0) {
    payload.parameters = params.parameters;
  }

  const resp = await fetch(params.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await resp.json().catch(() => null);
  if (!resp.ok) {
    fail(`Aliyun request failed with status ${resp.status}: ${JSON.stringify(body)}`);
  }
  if (!body || typeof body !== "object") {
    fail("Aliyun response is invalid");
  }
  if (Object.hasOwn(body, "code")) {
    fail(`Aliyun returned an error: ${JSON.stringify(body)}`);
  }

  const urls: string[] = [];
  const output = (body as { output?: unknown }).output;
  const choices =
    output && typeof output === "object" ? (output as { choices?: unknown }).choices : undefined;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const message =
        choice && typeof choice === "object"
          ? (choice as { message?: unknown }).message
          : undefined;
      const content =
        message && typeof message === "object"
          ? (message as { content?: unknown }).content
          : undefined;
      if (!Array.isArray(content)) {
        continue;
      }
      for (const item of content) {
        const image =
          item && typeof item === "object" ? (item as { image?: unknown }).image : undefined;
        if (typeof image === "string" && image.trim()) {
          urls.push(image);
        }
      }
    }
  }
  return urls;
}

export function createTxt2ImgAlyTool(options?: {
  apiKey?: string;
  baseUrl?: string;
}): AnyAgentTool {
  const apiKey = options?.apiKey ?? process.env.OPENCLAW_ALY_API_KEY ?? "";
  const baseUrl =
    options?.baseUrl ??
    process.env.OPENCLAW_ALY_BASE_URL ??
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

  return {
    name: "txt2img_aly",
    description: "基于文本生成图片。",
    parameters: {
      properties: {
        model: {
          description: "模型名称，例如 qwen-image-max",
          type: "string",
        },
        input_: {
          properties: {
            messages: {
              description: "请求内容数组，仅支持单轮对话",
              items: {
                properties: {
                  role: {
                    const: "user",
                    description: "消息角色，必须为 user",
                    type: "string",
                  },
                  content: {
                    description: "消息内容数组，仅允许一个 text",
                    items: {
                      properties: {
                        text: {
                          description:
                            "正向提示词，用于描述期望生成的图像内容、风格和构图。支持中英文，最长800字符。",
                          maxLength: 800,
                          type: "string",
                        },
                      },
                      required: ["text"],
                      type: "object",
                    },
                    maxItems: 1,
                    minItems: 1,
                    type: "array",
                  },
                },
                required: ["role", "content"],
                type: "object",
              },
              maxItems: 1,
              minItems: 1,
              type: "array",
            },
          },
          required: ["messages"],
          type: "object",
          description: "输入基本信息",
        },
        parameters: {
          type: "object",
          description: "图像生成参数",
        },
      },
      required: ["model", "input_"],
      type: "object",
    },

    async execute(_id, params) {
      try {
        if (!apiKey) {
          throw new Error("OPENCLAW_ALY_API_KEY not configured");
        }
        if (!params || typeof params !== "object") {
          throw new Error("params required");
        }

        const record = params as Record<string, unknown>;
        const model = record.model;
        if (model !== "qwen-image-max") {
          throw new Error("model 的值目前只支持 `qwen-image-max`");
        }

        const input_ = record.input_;
        readPrompt(input_);
        const parsedParameters = parseParameters(record.parameters);

        const urls = await callAly({
          apiKey,
          baseUrl,
          model,
          input_: input_ as Record<string, unknown>,
          parameters: parsedParameters,
        });

        if (urls.length === 0) {
          throw new Error("Aliyun response has no generated image URLs");
        }

        return {
          content: [
            {
              type: "text",
              text: [`已生成 ${urls.length} 张图片：`, ...urls.map((url) => `- ${url}`)].join("\n"),
            },
          ],
          details: {
            model,
            count: urls.length,
            urls,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "txt2img_aly failed",
            },
          ],
          isError: true,
        };
      }
    },
  };
}

export default function register(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as { apiKey?: string; baseUrl?: string };

  api.registerTool(
    createTxt2ImgAlyTool({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
    }),
  );
}
