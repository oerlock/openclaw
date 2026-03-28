import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";

type SupportedModel = "wan2.6-i2v-flash";
type SupportedResolution = "480P" | "720P" | "1080P";
type ShotType = "single" | "multi";

type VideoGenInput = {
  prompt?: string;
  negative_prompt?: string;
  img_url: string;
  audio_url?: string;
  template?: string;
};

type VideoGenParameters = {
  resolution?: SupportedResolution;
  duration?: number;
  prompt_extend?: boolean;
  shot_type?: ShotType;
  audio?: boolean;
  watermark?: boolean;
  seed?: number;
};

type CreateVideoGenTaskArgs = {
  model: SupportedModel;
  input_: VideoGenInput;
  parameters?: VideoGenParameters;
};

type GetVideoGenResultArgs = {
  task_id: string;
};

type PluginConfig = {
  apiKey?: string;
  createTaskUrl?: string;
  taskResultBaseUrl?: string;
};

const DEFAULT_CREATE_TASK_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";
const DEFAULT_TASK_RESULT_BASE_URL = "https://dashscope.aliyuncs.com/api/v1/tasks";

const SUPPORTED_MODELS = new Set<SupportedModel>(["wan2.6-i2v-flash"]);
const SUPPORTED_RESOLUTIONS = new Set<SupportedResolution>(["480P", "720P", "1080P"]);
const SUPPORTED_SHOT_TYPES = new Set<ShotType>(["single", "multi"]);
const ALLOWED_PARAMETER_KEYS = new Set([
  "resolution",
  "duration",
  "prompt_extend",
  "shot_type",
  "audio",
  "watermark",
  "seed",
]);

function fail(message: string): never {
  throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAllowedUrl(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("oss://") ||
    value.startsWith("data:")
  );
}

function readOptionalString(
  input: Record<string, unknown>,
  key: "prompt" | "negative_prompt" | "audio_url" | "template",
): string | undefined {
  const value = input[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    fail(`input_.${key} must be a string`);
  }
  return value;
}

function parseInput(raw: unknown): VideoGenInput {
  if (!isRecord(raw)) {
    fail("input_ required");
  }

  const imgUrlRaw = raw.img_url;
  if (typeof imgUrlRaw !== "string") {
    fail("input_.img_url required");
  }

  const imgUrl = imgUrlRaw.trim();
  if (!imgUrl) {
    fail("input_.img_url required");
  }
  if (!isAllowedUrl(imgUrl)) {
    fail("input_.img_url must be HTTP/HTTPS/OSS/Base64 data");
  }

  const prompt = readOptionalString(raw, "prompt");
  if (prompt !== undefined && prompt.length > 1500) {
    fail("input_.prompt must be <= 1500 characters");
  }

  const negativePrompt = readOptionalString(raw, "negative_prompt");
  if (negativePrompt !== undefined && negativePrompt.length > 500) {
    fail("input_.negative_prompt must be <= 500 characters");
  }

  const audioUrl = readOptionalString(raw, "audio_url");
  const template = readOptionalString(raw, "template");
  if (template !== undefined && !template.trim()) {
    fail("input_.template must not be empty");
  }
  const normalizedTemplate = template?.trim();

  if (audioUrl !== undefined) {
    const trimmedAudioUrl = audioUrl.trim();
    if (!trimmedAudioUrl) {
      fail("input_.audio_url must not be empty");
    }
    if (!isAllowedUrl(trimmedAudioUrl)) {
      fail("input_.audio_url must be HTTP/HTTPS/OSS/Base64 data");
    }
    return {
      prompt,
      negative_prompt: negativePrompt,
      img_url: imgUrl,
      audio_url: trimmedAudioUrl,
      template: normalizedTemplate,
    };
  }

  return {
    prompt,
    negative_prompt: negativePrompt,
    img_url: imgUrl,
    template: normalizedTemplate,
  };
}

function parseParameters(raw: unknown): VideoGenParameters | undefined {
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

  const parameters: VideoGenParameters = {};

  if (parsed.resolution !== undefined) {
    if (
      typeof parsed.resolution !== "string" ||
      !SUPPORTED_RESOLUTIONS.has(parsed.resolution as SupportedResolution)
    ) {
      fail("parameters.resolution must be one of 480P, 720P, 1080P");
    }
    parameters.resolution = parsed.resolution as SupportedResolution;
  }

  if (parsed.duration !== undefined) {
    if (typeof parsed.duration !== "number" || !Number.isInteger(parsed.duration)) {
      fail("parameters.duration must be an integer");
    }
    if (parsed.duration < 2 || parsed.duration >= 16) {
      fail("parameters.duration must be between 2 and 15");
    }
    parameters.duration = parsed.duration;
  }

  if (parsed.prompt_extend !== undefined) {
    if (typeof parsed.prompt_extend !== "boolean") {
      fail("parameters.prompt_extend must be a boolean");
    }
    parameters.prompt_extend = parsed.prompt_extend;
  }

  if (parsed.shot_type !== undefined) {
    if (
      typeof parsed.shot_type !== "string" ||
      !SUPPORTED_SHOT_TYPES.has(parsed.shot_type as ShotType)
    ) {
      fail("parameters.shot_type must be single or multi");
    }
    parameters.shot_type = parsed.shot_type as ShotType;
  }

  if (parsed.audio !== undefined) {
    if (typeof parsed.audio !== "boolean") {
      fail("parameters.audio must be a boolean");
    }
    parameters.audio = parsed.audio;
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

function parseCreateTaskArgs(raw: unknown): CreateVideoGenTaskArgs {
  if (!isRecord(raw)) {
    fail("tool parameters must be an object");
  }

  if (typeof raw.model !== "string" || !SUPPORTED_MODELS.has(raw.model as SupportedModel)) {
    fail("model only supports wan2.6-i2v-flash");
  }

  return {
    model: raw.model as SupportedModel,
    input_: parseInput(raw.input_),
    parameters: parseParameters(raw.parameters),
  };
}

function parseGetResultArgs(raw: unknown): GetVideoGenResultArgs {
  if (!isRecord(raw)) {
    fail("tool parameters must be an object");
  }

  if (typeof raw.task_id !== "string" || !raw.task_id.trim()) {
    fail("task_id required");
  }

  return {
    task_id: raw.task_id.trim(),
  };
}

function readApiKey(options?: PluginConfig): string {
  const apiKey = options?.apiKey?.trim();
  if (!apiKey) {
    fail("pluginConfig.apiKey is required");
  }
  return apiKey;
}

async function callCreateVideoTask(
  args: CreateVideoGenTaskArgs,
  options?: PluginConfig,
): Promise<Record<string, unknown>> {
  const apiKey = readApiKey(options);

  const payload: Record<string, unknown> = {
    model: args.model,
    input: args.input_,
  };

  if (args.parameters && Object.keys(args.parameters).length > 0) {
    payload.parameters = args.parameters;
  }

  const response = await fetch(options?.createTaskUrl?.trim() || DEFAULT_CREATE_TASK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
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

  return body;
}

async function callGetVideoTaskResult(
  args: GetVideoGenResultArgs,
  options?: PluginConfig,
): Promise<Record<string, unknown>> {
  const apiKey = readApiKey(options);
  const baseUrl = options?.taskResultBaseUrl?.trim() || DEFAULT_TASK_RESULT_BASE_URL;

  const response = await fetch(`${baseUrl}/${encodeURIComponent(args.task_id)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    fail(`DashScope request failed with status ${response.status}: ${JSON.stringify(body)}`);
  }
  if (!isRecord(body)) {
    fail("DashScope response is invalid");
  }

  return body;
}

export function createCreateVideoGenTaskTool(options?: PluginConfig) {
  return {
    name: "creat_video_gen_task",
    description:
      "根据首帧图片、可选提示词和参数创建视频生成任务，返回 DashScope 异步任务详情（包含任务 ID）。",
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          enum: ["wan2.6-i2v-flash"],
          description: "模型名称，目前仅支持 wan2.6-i2v-flash。",
        },
        input_: {
          type: "object",
          description: "输入基本信息，包括首帧图像 URL/Base64、可选提示词和可选音频 URL。",
          properties: {
            prompt: {
              type: "string",
              maxLength: 1500,
              description: "正向提示词，最长 1500 字符。",
            },
            negative_prompt: {
              type: "string",
              maxLength: 500,
              description: "反向提示词，最长 500 字符。",
            },
            img_url: {
              type: "string",
              description: "首帧图像 URL 或 Base64 数据。",
            },
            audio_url: {
              type: "string",
              description: "可选音频 URL 或 Base64 数据。",
            },
            template: {
              type: "string",
              description: "视频特效模板名称；不填写表示不使用特效模板。",
            },
          },
          required: ["img_url"],
          additionalProperties: false,
        },
        parameters: {
          type: "object",
          description: "可选视频参数，也支持传 JSON 字符串。",
          properties: {
            resolution: {
              type: "string",
              enum: ["480P", "720P", "1080P"],
              description: "视频分辨率档位。",
            },
            duration: {
              type: "integer",
              minimum: 2,
              maximum: 15,
              description: "视频时长（秒）。",
            },
            prompt_extend: {
              type: "boolean",
              description: "是否开启 prompt 智能改写。",
            },
            shot_type: {
              type: "string",
              enum: ["single", "multi"],
              description: "镜头类型。",
            },
            audio: {
              type: "boolean",
              description: "是否输出有声视频。",
            },
            watermark: {
              type: "boolean",
              description: "是否添加水印标识。",
            },
            seed: {
              type: "integer",
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
        const parsed = parseCreateTaskArgs(params);
        const result = await callCreateVideoTask(parsed, options);

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          details: {
            model: parsed.model,
            has_audio_url: Boolean(parsed.input_.audio_url),
            duration: parsed.parameters?.duration ?? 5,
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

export function createGetVideoGenResultTool(options?: PluginConfig) {
  return {
    name: "get_video_gen_result",
    description: "根据视频任务 ID 查询异步任务状态和输出结果。",
    parameters: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "视频生成任务 ID。",
        },
      },
      required: ["task_id"],
      additionalProperties: false,
    },
    async execute(_id: string, params: unknown) {
      try {
        const parsed = parseGetResultArgs(params);
        const result = await callGetVideoTaskResult(parsed, options);

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          details: {
            task_id: parsed.task_id,
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
  const options = (api.pluginConfig ?? {}) as PluginConfig;
  api.registerTool(createCreateVideoGenTaskTool(options));
  api.registerTool(createGetVideoGenResultTool(options));
}
