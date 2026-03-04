import type { AnyAgentTool, OpenClawPluginApi } from "../../src/plugins/types.js";

type AlyModel = "qwen3-vl-plus";

type InputPayload = {
  prompt: string;
  image: string;
};

type ChatClient = {
  chat: {
    completions: {
      create(params: {
        model: AlyModel;
        messages: Array<{
          role: "user";
          content: Array<
            { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
          >;
        }>;
      }): Promise<{
        choices?: Array<{
          message?: {
            content?: string | null;
          };
        }>;
      }>;
    };
  };
};

const ALLOWED_MODELS = new Set<AlyModel>(["qwen3-vl-plus"]);

function fail(message: string): never {
  throw new Error(message);
}

function isImageRef(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("oss://") ||
    value.startsWith("data:image/")
  );
}

function readInput(raw: unknown): InputPayload {
  if (!raw || typeof raw !== "object") {
    fail("input_ required");
  }

  const input = raw as { prompt?: unknown; image?: unknown };

  if (typeof input.prompt !== "string" || !input.prompt.trim()) {
    fail("input_.prompt required");
  }
  if (input.prompt.length > 800) {
    fail("input_.prompt must be <= 800 characters");
  }

  if (typeof input.image !== "string" || !isImageRef(input.image)) {
    fail("input_.image must be public URL, OSS URL, or base64 data:image string");
  }

  return {
    prompt: input.prompt,
    image: input.image,
  };
}

async function createChatClient(apiKey: string, baseUrl: string): Promise<ChatClient> {
  const { default: OpenAI } = await import("openai");
  return new OpenAI({
    apiKey,
    baseURL: baseUrl,
  }) as ChatClient;
}

async function callAly(params: {
  client: ChatClient;
  model: AlyModel;
  input_: InputPayload;
}): Promise<string> {
  const response = await params.client.chat.completions.create({
    model: params.model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: params.input_.prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: params.input_.image,
            },
          },
        ],
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    fail("Aliyun response has no text content");
  }

  return content;
}

export function createImg2TxtAlyTool(options?: {
  apiKey?: string;
  baseUrl?: string;
  client?: ChatClient;
}): AnyAgentTool {
  const apiKey = options?.apiKey ?? "";
  const baseUrl = options?.baseUrl ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";

  return {
    name: "img2txt_aly",
    description: "根据提示词对图片进行语义级理解和描述。",
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description: "模型名称",
          enum: Array.from(ALLOWED_MODELS),
        },
        input_: {
          type: "object",
          description: "输入图像与处理指令",
          properties: {
            prompt: {
              type: "string",
              description: "对图片的处理指令或分析要求",
              minLength: 1,
              maxLength: 800,
            },
            image: {
              type: "string",
              description: "输入图像 URL、OSS URL 或 Base64 data:image",
            },
          },
          required: ["prompt", "image"],
          additionalProperties: false,
        },
      },
      required: ["model", "input_"],
      additionalProperties: false,
    },

    async execute(_id, params) {
      try {
        if (!apiKey) {
          throw new Error("pluginConfig.apiKey not configured");
        }
        if (!params || typeof params !== "object") {
          throw new Error("params required");
        }

        const record = params as Record<string, unknown>;
        const model = record.model;
        if (!ALLOWED_MODELS.has(model as AlyModel)) {
          throw new Error("model must be qwen3-vl-plus");
        }

        const input_ = readInput(record.input_);
        const client = options?.client ?? (await createChatClient(apiKey, baseUrl));
        const text = await callAly({
          client,
          model,
          input_,
        });

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
          details: {
            model,
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : "img2txt_aly failed",
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
    createImg2TxtAlyTool({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
    }),
  );
}
