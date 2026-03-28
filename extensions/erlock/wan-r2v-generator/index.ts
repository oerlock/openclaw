import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";

type SupportedModel = "wan2.6-r2v-flash" | "wan2.6-r2v";
type ShotType = "single" | "multi";
type SupportedTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "UNKNOWN";

type ReferenceVideoInput = {
  prompt: string;
  negative_prompt?: string;
  reference_urls: string[];
};

type ReferenceVideoParameters = {
  size?: string;
  duration?: number;
  shot_type?: ShotType;
  audio?: boolean;
  watermark?: boolean;
  seed?: number;
};

type CreateReferenceVideoTaskArgs = {
  model: SupportedModel;
  input_: ReferenceVideoInput;
  parameters?: ReferenceVideoParameters;
};

type GetReferenceVideoResultArgs = {
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

const SUPPORTED_MODELS = new Set<SupportedModel>(["wan2.6-r2v-flash", "wan2.6-r2v"]);
const SUPPORTED_SHOT_TYPES = new Set<ShotType>(["single", "multi"]);
const SUPPORTED_TASK_STATUS = new Set<SupportedTaskStatus>([
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
  "UNKNOWN",
]);
const SUPPORTED_SIZES = new Set<string>([
  "1280*720",
  "720*1280",
  "960*960",
  "1088*832",
  "832*1088",
  "1920*1080",
  "1080*1920",
  "1440*1440",
  "1632*1248",
  "1248*1632",
]);
const ALLOWED_PARAMETER_KEYS = new Set([
  "size",
  "duration",
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

function isAllowedReferenceUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("oss://");
}

function parseInput(raw: unknown): ReferenceVideoInput {
  if (!isRecord(raw)) {
    fail("input_ required");
  }

  if (typeof raw.prompt !== "string" || !raw.prompt.trim()) {
    fail("input_.prompt required");
  }

  const prompt = raw.prompt.trim();
  if (prompt.length > 1500) {
    fail("input_.prompt must be <= 1500 characters");
  }

  let negativePrompt: string | undefined;
  if (raw.negative_prompt !== undefined && raw.negative_prompt !== null) {
    if (typeof raw.negative_prompt !== "string") {
      fail("input_.negative_prompt must be a string");
    }
    if (raw.negative_prompt.length > 500) {
      fail("input_.negative_prompt must be <= 500 characters");
    }
    negativePrompt = raw.negative_prompt;
  }

  if (
    !Array.isArray(raw.reference_urls) ||
    raw.reference_urls.length < 1 ||
    raw.reference_urls.length > 5
  ) {
    fail("input_.reference_urls must contain between 1 and 5 URLs");
  }

  const normalizedUrls: string[] = [];
  let videoCount = 0;

  raw.reference_urls.forEach((item, index) => {
    if (typeof item !== "string") {
      fail(`input_.reference_urls[${index}] must be a string URL`);
    }

    const url = item.trim();
    if (!url) {
      fail(`input_.reference_urls[${index}] must not be empty`);
    }
    if (!isAllowedReferenceUrl(url)) {
      fail(`input_.reference_urls[${index}] must start with http://, https://, or oss://`);
    }

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".mov")) {
      videoCount += 1;
    }

    normalizedUrls.push(url);
  });

  if (videoCount > 3) {
    fail("input_.reference_urls can contain at most 3 video URLs");
  }

  return {
    prompt,
    negative_prompt: negativePrompt,
    reference_urls: normalizedUrls,
  };
}

function parseParameters(raw: unknown): ReferenceVideoParameters | undefined {
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

  const parameters: ReferenceVideoParameters = {};

  if (parsed.size !== undefined) {
    if (typeof parsed.size !== "string" || !SUPPORTED_SIZES.has(parsed.size)) {
      fail(
        "parameters.size must be one of 1280*720, 720*1280, 960*960, 1088*832, 832*1088, 1920*1080, 1080*1920, 1440*1440, 1632*1248, 1248*1632",
      );
    }
    parameters.size = parsed.size;
  }

  if (parsed.duration !== undefined) {
    if (typeof parsed.duration !== "number" || !Number.isInteger(parsed.duration)) {
      fail("parameters.duration must be an integer");
    }
    if (parsed.duration < 2 || parsed.duration > 10) {
      fail("parameters.duration must be between 2 and 10");
    }
    parameters.duration = parsed.duration;
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

function parseCreateTaskArgs(raw: unknown): CreateReferenceVideoTaskArgs {
  if (!isRecord(raw)) {
    fail("tool parameters must be an object");
  }

  if (typeof raw.model !== "string" || !SUPPORTED_MODELS.has(raw.model as SupportedModel)) {
    fail("model only supports wan2.6-r2v-flash or wan2.6-r2v");
  }

  const input = parseInput(raw.input_);
  const parameters = parseParameters(raw.parameters);

  if (raw.model === "wan2.6-r2v" && parameters?.audio === false) {
    fail("parameters.audio=false is only supported by wan2.6-r2v-flash");
  }

  return {
    model: raw.model as SupportedModel,
    input_: input,
    parameters,
  };
}

function parseGetResultArgs(raw: unknown): GetReferenceVideoResultArgs {
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
    fail(
      "pluginConfig.apiKey is not set; install-time can leave it empty, but set it before calling this tool",
    );
  }
  return apiKey;
}

async function callCreateTask(
  args: CreateReferenceVideoTaskArgs,
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

  const output = isRecord(body.output) ? body.output : undefined;
  const taskId = output?.task_id;
  const taskStatus = output?.task_status;

  if (typeof taskId !== "string" || !taskId.trim()) {
    fail(`DashScope create task response missing task_id: ${JSON.stringify(body)}`);
  }
  if (
    typeof taskStatus !== "string" ||
    !SUPPORTED_TASK_STATUS.has(taskStatus as SupportedTaskStatus)
  ) {
    fail(`DashScope create task response has invalid task_status: ${JSON.stringify(body)}`);
  }

  return body;
}

async function callGetTaskResult(
  args: GetReferenceVideoResultArgs,
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

export function createCreateReferenceVideoTaskTool(options?: PluginConfig) {
  return {
    name: "create_reference_video_task",
    description:
      "创建万相参考生视频异步任务。支持文本+图像/视频参考输入，可生成单镜头或多镜头视频。",
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          enum: ["wan2.6-r2v-flash", "wan2.6-r2v"],
          description: "模型名称。wan2.6-r2v-flash 支持有声和无声视频，wan2.6-r2v 仅支持有声视频。",
        },
        input_: {
          type: "object",
          description: "输入内容，包含提示词和参考素材 URL 列表。",
          properties: {
            prompt: {
              type: "string",
              maxLength: 1500,
              description:
                "正向提示词，使用 character1/character2 等引用 reference_urls 中的角色顺序。",
            },
            negative_prompt: {
              type: "string",
              maxLength: 500,
              description: "可选反向提示词，最长 500 字符。",
            },
            reference_urls: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: {
                type: "string",
              },
              description:
                "参考素材 URL 列表（http/https/oss）。最多 5 个素材，其中视频最多 3 个。",
            },
          },
          required: ["prompt", "reference_urls"],
          additionalProperties: false,
        },
        parameters: {
          type: "object",
          description: "可选视频参数，也支持传 JSON 字符串。",
          properties: {
            size: {
              type: "string",
              description: "分辨率，例如 1280*720 或 1920*1080。",
            },
            duration: {
              type: "integer",
              minimum: 2,
              maximum: 10,
              description: "视频时长（秒）。",
            },
            shot_type: {
              type: "string",
              enum: ["single", "multi"],
              description: "镜头类型，single=单镜头，multi=多镜头。",
            },
            audio: {
              type: "boolean",
              description: "是否生成有声视频。仅 wan2.6-r2v-flash 支持设置为 false。",
            },
            watermark: {
              type: "boolean",
              description: "是否添加水印。",
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
        const result = await callCreateTask(parsed, options);

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          details: {
            model: parsed.model,
            reference_count: parsed.input_.reference_urls.length,
            has_audio: parsed.parameters?.audio ?? true,
            shot_type: parsed.parameters?.shot_type ?? "single",
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

export function createGetReferenceVideoResultTool(options?: PluginConfig) {
  return {
    name: "get_reference_video_result",
    description: "根据 task_id 查询万相参考生视频任务状态和结果（video_url）。",
    parameters: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "异步任务 ID。",
        },
      },
      required: ["task_id"],
      additionalProperties: false,
    },
    async execute(_id: string, params: unknown) {
      try {
        const parsed = parseGetResultArgs(params);
        const result = await callGetTaskResult(parsed, options);

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
  api.registerTool(createCreateReferenceVideoTaskTool(options));
  api.registerTool(createGetReferenceVideoResultTool(options));
}
