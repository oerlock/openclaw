import type { AnyAgentTool, OpenClawPluginApi } from "../../src/plugins/types.js";

type Txt2ImgArgs = {
  model: string;
  input_: {
    messages: Array<{
      role: "user";
      content: Array<{ text: string }>;
    }>;
  };
  parameters?: {
    negative_prompt?: string;
    size?: "1664*928" | "1472*1104" | "1328*1328" | "1104*1472" | "928*1664";
    n?: 1;
    seed?: number;
  };
};

const DEFAULT_BASE_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
const ALLOWED_SIZES = new Set(["1664*928", "1472*1104", "1328*1328", "1104*1472", "928*1664"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseArgs(raw: unknown): Txt2ImgArgs {
  if (!isRecord(raw)) {
    throw new Error("params required");
  }

  const model = typeof raw.model === "string" ? raw.model.trim() : "";
  if (model !== "qwen-image-max") {
    throw new Error("model 的值目前只支持 `qwen-image-max`");
  }

  const inputRaw = raw.input_;
  if (!isRecord(inputRaw) || !Array.isArray(inputRaw.messages) || inputRaw.messages.length !== 1) {
    throw new Error("input_.messages 仅支持单轮对话");
  }

  const message = inputRaw.messages[0];
  if (!isRecord(message) || message.role !== "user") {
    throw new Error("message.role 必须为 user");
  }
  if (
    !Array.isArray(message.content) ||
    message.content.length !== 1 ||
    !isRecord(message.content[0])
  ) {
    throw new Error("message.content 仅允许一个 text");
  }

  const text = typeof message.content[0].text === "string" ? message.content[0].text.trim() : "";
  if (!text) {
    throw new Error("text required");
  }
  if (text.length > 800) {
    throw new Error("text 最长800字符");
  }

  const parsed: Txt2ImgArgs = {
    model,
    input_: {
      messages: [{ role: "user", content: [{ text }] }],
    },
  };

  if (!Object.hasOwn(raw, "parameters") || raw.parameters == null) {
    return parsed;
  }
  if (!isRecord(raw.parameters)) {
    throw new Error("parameters must be an object");
  }

  const parameters: Txt2ImgArgs["parameters"] = {};
  if (Object.hasOwn(raw.parameters, "negative_prompt")) {
    const value = raw.parameters.negative_prompt;
    if (typeof value !== "string") {
      throw new Error("negative_prompt must be a string");
    }
    if (value.length > 500) {
      throw new Error("negative_prompt 最长500字符");
    }
    parameters.negative_prompt = value;
  }

  if (Object.hasOwn(raw.parameters, "size")) {
    const value = raw.parameters.size;
    if (typeof value !== "string" || !ALLOWED_SIZES.has(value)) {
      throw new Error("size 不是支持的分辨率");
    }
    parameters.size = value as Txt2ImgArgs["parameters"]["size"];
  }

  if (Object.hasOwn(raw.parameters, "n")) {
    if (raw.parameters.n !== 1) {
      throw new Error("n 仅支持1");
    }
    parameters.n = 1;
  }

  if (Object.hasOwn(raw.parameters, "seed")) {
    const value = raw.parameters.seed;
    if (!Number.isInteger(value) || value < 0 || value >= 2147483648) {
      throw new Error("seed 范围[0,2147483647]");
    }
    parameters.seed = value;
  }

  if (Object.keys(parameters).length > 0) {
    parsed.parameters = parameters;
  }
  return parsed;
}

function extractImageUrls(payload: Record<string, unknown>): string[] {
  const output = isRecord(payload.output) ? payload.output : null;
  const choices = output && Array.isArray(output.choices) ? output.choices : [];
  const urls: string[] = [];

  for (const choice of choices) {
    if (!isRecord(choice)) {
      continue;
    }
    const message = isRecord(choice.message) ? choice.message : null;
    const content = message && Array.isArray(message.content) ? message.content : [];
    for (const item of content) {
      if (isRecord(item) && typeof item.image === "string" && item.image.trim()) {
        urls.push(item.image);
      }
    }
  }

  return urls;
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function createTxt2ImgAlyTool(): AnyAgentTool {
  return {
    name: "txt2img_aly",
    description: "基于文本生成图片。在各类生成任务中表现优于 `txt2img` 工具。",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
          description: "模型名称，例如 qwen-image-max",
        },
        input_: {
          type: "object",
          description: "输入基本信息，仅支持单轮 user text",
        },
        parameters: {
          type: "object",
          description: "图像生成参数（negative_prompt、size、n、seed）",
        },
      },
      required: ["model", "input_"],
    },
    async execute(_id, params) {
      try {
        const parsed = parseArgs(params);
        const apiKey = process.env.OPENCLAW_ALY_API_KEY;
        if (!apiKey) {
          return errorResult("OPENCLAW_ALY_API_KEY is required");
        }

        const reqPayload: Record<string, unknown> = {
          model: parsed.model,
          input: parsed.input_,
        };
        if (parsed.parameters) {
          reqPayload.parameters = parsed.parameters;
        }

        const response = await fetch(process.env.OPENCLAW_ALY_BASE_URL ?? DEFAULT_BASE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqPayload),
        });

        const data = (await response.json()) as Record<string, unknown>;
        if (Object.hasOwn(data, "code")) {
          throw new Error(`There was an error: ${JSON.stringify(data)}`);
        }

        const urls = extractImageUrls(data);
        if (urls.length === 0) {
          throw new Error(`There are no images in ${JSON.stringify(data)}`);
        }

        return {
          content: [
            { type: "text" as const, text: `Generated ${urls.length} image(s)` },
            {
              type: "text" as const,
              text: urls.join("\n"),
            },
          ],
          details: {
            urls,
            model: parsed.model,
          },
        };
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : "txt2img_aly failed");
      }
    },
  };
}

export default function register(api: OpenClawPluginApi) {
  api.registerTool(createTxt2ImgAlyTool());
}
