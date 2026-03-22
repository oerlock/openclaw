import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";

type SupportedModel = "qwen-image-2.0" | "qwen-image-2.0-pro";
type MessageRole = "user";

type ImageItem = {
  image: string;
};

type TextItem = {
  text: string;
};

type Message = {
  role: MessageRole;
  content: Array<ImageItem | TextItem>;
};

type ImageGeneratorInput = {
  messages: [Message];
};

type ImageGeneratorParameters = {
  n?: number;
  negative_prompt?: string;
  size?: string;
  prompt_extend?: boolean;
  watermark?: boolean;
  seed?: number;
};

type ImageGeneratorArgs = {
  model: SupportedModel;
  input_: ImageGeneratorInput;
  parameters?: ImageGeneratorParameters;
};

type PluginConfig = {
  apiKey?: string;
  baseUrl?: string;
};

const DEFAULT_BASE_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const SUPPORTED_MODELS = new Set<SupportedModel>(["qwen-image-2.0", "qwen-image-2.0-pro"]);
const ALLOWED_PARAMETER_KEYS = new Set([
  "n",
  "negative_prompt",
  "size",
  "prompt_extend",
  "watermark",
  "seed",
]);

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateImage(value: unknown, index: number): ImageItem {
  if (!isRecord(value) || typeof value.image !== "string") {
    fail(`input_.messages[0].content[${index}].image required`);
  }

  const image = value.image.trim();
  if (!image) {
    fail(`input_.messages[0].content[${index}].image required`);
  }

  if (
    !(
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("oss://") ||
      image.startsWith("data:")
    )
  ) {
    fail(`input_.messages[0].content[${index}].image must be HTTP/HTTPS/OSS/Base64 data`);
  }

  return { image };
}

function validateText(value: unknown, index: number): TextItem {
  if (!isRecord(value) || typeof value.text !== "string") {
    fail(`input_.messages[0].content[${index}].text required`);
  }

  const text = value.text.trim();
  if (!text) {
    fail(`input_.messages[0].content[${index}].text required`);
  }
  if (text.length > 800) {
    fail(`input_.messages[0].content[${index}].text must be <= 800 characters`);
  }

  return { text };
}

function parseInput(raw: unknown): ImageGeneratorInput {
  if (!isRecord(raw)) {
    fail("input_ required");
  }

  const messages = raw.messages;
  if (!Array.isArray(messages) || messages.length !== 1) {
    fail("input_.messages must contain exactly one message");
  }

  const firstMessage = messages[0];
  if (!isRecord(firstMessage)) {
    fail("input_.messages[0] invalid");
  }
  if (firstMessage.role !== "user") {
    fail("input_.messages[0].role must be user");
  }
  if (!Array.isArray(firstMessage.content)) {
    fail("input_.messages[0].content must be an array");
  }
  if (firstMessage.content.length < 1 || firstMessage.content.length > 4) {
    fail("input_.messages[0].content must contain between 1 and 4 items");
  }

  const content: Array<ImageItem | TextItem> = [];
  let imageCount = 0;
  let textCount = 0;

  firstMessage.content.forEach((item, index) => {
    if (isRecord(item) && Object.hasOwn(item, "image")) {
      content.push(validateImage(item, index));
      imageCount += 1;
      return;
    }
    if (isRecord(item) && Object.hasOwn(item, "text")) {
      content.push(validateText(item, index));
      textCount += 1;
      return;
    }
    fail(`input_.messages[0].content[${index}] must contain image or text`);
  });

  if (imageCount > 3) {
    fail("input_.messages[0].content must contain at most 3 images");
  }
  if (textCount !== 1) {
    fail("input_.messages[0].content must contain exactly 1 text item");
  }

  return {
    messages: [
      {
        role: "user",
        content,
      },
    ],
  };
}

function parseParameters(raw: unknown): ImageGeneratorParameters | undefined {
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

  if (!isRecord(parsed)) {
    fail("parameters must be an object");
  }

  const unknownKeys = Object.keys(parsed).filter((key) => !ALLOWED_PARAMETER_KEYS.has(key));
  if (unknownKeys.length > 0) {
    fail(`parameters has unknown fields: ${unknownKeys.join(", ")}`);
  }

  const parameters: ImageGeneratorParameters = {};

  if (parsed.n !== undefined) {
    if (typeof parsed.n !== "number" || !Number.isInteger(parsed.n)) {
      fail("parameters.n must be an integer");
    }
    if (parsed.n < 1 || parsed.n > 6) {
      fail("parameters.n must be between 1 and 6");
    }
    parameters.n = parsed.n;
  }

  if (parsed.negative_prompt !== undefined) {
    if (typeof parsed.negative_prompt !== "string") {
      fail("parameters.negative_prompt must be a string");
    }
    if (parsed.negative_prompt.length > 500) {
      fail("parameters.negative_prompt must be <= 500 characters");
    }
    parameters.negative_prompt = parsed.negative_prompt;
  }

  if (parsed.size !== undefined) {
    if (typeof parsed.size !== "string" || !/^\d{3,4}\*\d{3,4}$/.test(parsed.size)) {
      fail('parameters.size must match "1024*1536"');
    }

    const [widthText, heightText] = parsed.size.split("*");
    const width = Number(widthText);
    const height = Number(heightText);

    if (width < 512 || width > 2048) {
      fail("parameters.size width must be between 512 and 2048");
    }
    if (height < 512 || height > 2048) {
      fail("parameters.size height must be between 512 and 2048");
    }

    parameters.size = parsed.size;
  }

  if (parsed.prompt_extend !== undefined) {
    if (typeof parsed.prompt_extend !== "boolean") {
      fail("parameters.prompt_extend must be a boolean");
    }
    parameters.prompt_extend = parsed.prompt_extend;
  }

  if (parsed.watermark !== undefined) {
    if (typeof parsed.watermark !== "boolean") {
      fail("parameters.watermark must be a boolean");
    }
    parameters.watermark = parsed.watermark;
  }

  if (parsed.seed !== undefined) {
    if (typeof parsed.seed !== "number" || !Number.isInteger(parsed.seed)) {
      fail("parameters.seed must be an integer");
    }
    if (parsed.seed < 0 || parsed.seed > 2147483647) {
      fail("parameters.seed must be in [0, 2147483647]");
    }
    parameters.seed = parsed.seed;
  }

  return parameters;
}

function parseArgs(raw: unknown): ImageGeneratorArgs {
  if (!isRecord(raw)) {
    fail("tool parameters must be an object");
  }

  if (typeof raw.model !== "string" || !SUPPORTED_MODELS.has(raw.model as SupportedModel)) {
    fail("model only supports qwen-image-2.0 or qwen-image-2.0-pro");
  }

  return {
    model: raw.model as SupportedModel,
    input_: parseInput(raw.input_),
    parameters: parseParameters(raw.parameters),
  };
}

async function callImageGenerator(
  args: ImageGeneratorArgs,
  options?: PluginConfig,
): Promise<string[]> {
  const apiKey = options?.apiKey?.trim();
  if (!apiKey) {
    fail("pluginConfig.apiKey is required");
  }

  const payload: Record<string, unknown> = {
    model: args.model,
    input: args.input_,
  };

  if (args.parameters && Object.keys(args.parameters).length > 0) {
    payload.parameters = args.parameters;
  }

  const response = await fetch(options?.baseUrl?.trim() || DEFAULT_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    fail(`DashScope request failed with status ${response.status}: ${JSON.stringify(body)}`);
  }
  if (!isRecord(body)) {
    fail("DashScope response is invalid");
  }
  if (Object.hasOwn(body, "code")) {
    fail(`DashScope returned an error: ${JSON.stringify(body)}`);
  }

  const urls: string[] = [];
  const output = body.output;
  const choices = isRecord(output) ? output.choices : undefined;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const message = isRecord(choice) ? choice.message : undefined;
      const content = isRecord(message) ? message.content : undefined;
      if (!Array.isArray(content)) {
        continue;
      }

      for (const item of content) {
        const image = isRecord(item) ? item.image : undefined;
        if (typeof image === "string" && image.trim()) {
          urls.push(image);
        }
      }
    }
  }

  if (urls.length === 0) {
    fail(`There are no images in ${JSON.stringify(body)}`);
  }

  return urls;
}

export function createImageGeneratorTool(options?: PluginConfig) {
  return {
    name: "image_generator",
    description:
      "图像生成和编辑工具，支持文生图和图生图。可输入最多 3 张参考图，且必须提供 1 条文本提示词。",
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          enum: ["qwen-image-2.0", "qwen-image-2.0-pro"],
          description: "模型名称，推荐 qwen-image-2.0。",
        },
        input_: {
          type: "object",
          description: "输入内容，仅支持单轮 user 消息，包含 0-3 张图和 1 条文本提示词。",
          properties: {
            messages: {
              type: "array",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    const: "user",
                  },
                  content: {
                    type: "array",
                    minItems: 1,
                    maxItems: 4,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        image: {
                          type: "string",
                          description: "输入图像 URL 或 Base64 编码数据。",
                        },
                        text: {
                          type: "string",
                          description: "正向提示词，不超过 800 字符。",
                        },
                      },
                    },
                  },
                },
                required: ["role", "content"],
                additionalProperties: false,
              },
            },
          },
          required: ["messages"],
          additionalProperties: false,
        },
        parameters: {
          type: "object",
          description: "可选生成参数，也支持传 JSON 字符串。",
          properties: {
            n: {
              type: "number",
              minimum: 1,
              maximum: 6,
              description: "输出图像数量。",
            },
            negative_prompt: {
              type: "string",
              description: "反向提示词，不超过 500 字符。",
            },
            size: {
              type: "string",
              description: "分辨率，格式如 1024*1536。",
            },
            prompt_extend: {
              type: "boolean",
              description: "是否开启提示词智能改写。",
            },
            watermark: {
              type: "boolean",
              description: "是否添加水印标识。",
            },
            seed: {
              type: "number",
              minimum: 0,
              maximum: 2147483647,
              description: "随机数种子。",
            },
          },
          additionalProperties: false,
        },
      },
      required: ["model", "input_"],
      additionalProperties: false,
    },
    async execute(_id: string, params: unknown) {
      try {
        const parsed = parseArgs(params);
        const urls = await callImageGenerator(parsed, options);
        return {
          content: [{ type: "text", text: JSON.stringify(urls) }],
          details: {
            model: parsed.model,
            image_count: parsed.input_.messages[0].content.filter((item) => "image" in item).length,
            output_count: parsed.parameters?.n ?? 1,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error),
            },
          ],
          isError: true,
        };
      }
    },
  };
}

export default function register(api: OpenClawPluginApi) {
  api.registerTool(createImageGeneratorTool((api.pluginConfig ?? {}) as PluginConfig));
}
