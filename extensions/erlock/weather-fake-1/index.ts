import type { AnyAgentTool, OpenClawPluginApi } from "../../src/plugins/types.js";

type WeatherCondition = "sunny" | "cloudy" | "rainy" | "windy" | "stormy" | "snowy" | "foggy";

type FakeWeatherResult = {
  city: string;
  condition: WeatherCondition;
  temperatureC: number;
  humidityPercent: number;
  windKph: number;
};

const CONDITIONS: WeatherCondition[] = [
  "sunny",
  "cloudy",
  "rainy",
  "windy",
  "stormy",
  "snowy",
  "foggy",
];

function hash(input: string): number {
  // Stable hash so same city gives consistent fake weather.
  let value = 0;
  for (const ch of input) {
    value = (value * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return value;
}

function pickCondition(seed: number): WeatherCondition {
  return CONDITIONS[seed % CONDITIONS.length] ?? "sunny";
}

function fakeWeather(cityRaw: string): FakeWeatherResult {
  const city = cityRaw.trim();
  const seed = hash(city.toLowerCase());
  return {
    city,
    condition: pickCondition(seed),
    temperatureC: (seed % 36) - 5,
    humidityPercent: 30 + (seed % 61),
    windKph: 2 + (seed % 39),
  };
}

function formatWeather(result: FakeWeatherResult): string {
  return [
    `🌤️ Fake weather for ${result.city}`,
    `- Condition: ${result.condition}`,
    `- Temperature: ${result.temperatureC}°C`,
    `- Humidity: ${result.humidityPercent}%`,
    `- Wind: ${result.windKph} km/h`,
    "",
    "(demo data only; not real weather)",
  ].join("\n");
}

function readCity(params: unknown): string | null {
  if (!params || typeof params !== "object") {
    return null;
  }
  const record = params as Record<string, unknown>;
  const raw = record.city;
  if (typeof raw !== "string") {
    return null;
  }
  const city = raw.trim();
  return city ? city : null;
}

type Txt2ImgAlyParams = {
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

const TXT2IMG_ALLOWED_SIZES = new Set([
  "1664*928",
  "1472*1104",
  "1328*1328",
  "1104*1472",
  "928*1664",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTxt2ImgParams(params: unknown): Txt2ImgAlyParams {
  if (!isRecord(params)) {
    throw new Error("params required");
  }

  const model = typeof params.model === "string" ? params.model.trim() : "";
  if (model !== "qwen-image-max") {
    throw new Error("model 的值目前只支持 `qwen-image-max`");
  }

  const inputRaw = params.input_;
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

  const parsed: Txt2ImgAlyParams = {
    model,
    input_: {
      messages: [
        {
          role: "user",
          content: [{ text }],
        },
      ],
    },
  };

  if (!Object.hasOwn(params, "parameters") || params.parameters == null) {
    return parsed;
  }

  if (!isRecord(params.parameters)) {
    throw new Error("parameters must be an object");
  }

  const parameters: Txt2ImgAlyParams["parameters"] = {};

  if (Object.hasOwn(params.parameters, "negative_prompt")) {
    const value = params.parameters.negative_prompt;
    if (typeof value !== "string") {
      throw new Error("negative_prompt must be a string");
    }
    if (value.length > 500) {
      throw new Error("negative_prompt 最长500字符");
    }
    parameters.negative_prompt = value;
  }

  if (Object.hasOwn(params.parameters, "size")) {
    const value = params.parameters.size;
    if (typeof value !== "string" || !TXT2IMG_ALLOWED_SIZES.has(value)) {
      throw new Error("size 不是支持的分辨率");
    }
    parameters.size = value as Txt2ImgAlyParams["parameters"]["size"];
  }

  if (Object.hasOwn(params.parameters, "n")) {
    const value = params.parameters.n;
    if (value !== 1) {
      throw new Error("n 仅支持1");
    }
    parameters.n = 1;
  }

  if (Object.hasOwn(params.parameters, "seed")) {
    const value = params.parameters.seed;
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

function base64FromBuffer(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

export function createTxt2ImgAlyTool(): AnyAgentTool {
  return {
    name: "txt2img_aly",
    description:
      "基于文本生成图片（qwen-image-max）。参数结构与阿里云 Model Studio 的图像生成接口对齐。",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        model: {
          type: "string",
          description: "模型名称，目前只支持 qwen-image-max",
        },
        input_: {
          type: "object",
          description: "请求输入，仅支持单轮 user text",
        },
        parameters: {
          type: "object",
          description: "可选生成参数（negative_prompt / size / n / seed）",
        },
      },
      required: ["model", "input_"],
    },
    async execute(_id, params) {
      try {
        const parsed = readTxt2ImgParams(params);
        const apiKey = process.env.OPENCLAW_ALY_API_KEY;
        const baseUrl =
          process.env.OPENCLAW_ALY_BASE_URL ??
          "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

        if (!apiKey) {
          throw new Error("OPENCLAW_ALY_API_KEY is required");
        }

        const payload: Record<string, unknown> = {
          model: parsed.model,
          input: parsed.input_,
        };
        if (parsed.parameters) {
          payload.parameters = parsed.parameters;
        }

        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as Record<string, unknown>;
        if (isRecord(data) && Object.hasOwn(data, "code")) {
          throw new Error(`There was an error: ${JSON.stringify(data)}`);
        }

        const output = isRecord(data.output) ? data.output : null;
        const choices = output && Array.isArray(output.choices) ? output.choices : [];
        const urls: string[] = [];
        for (const choice of choices) {
          if (!isRecord(choice)) continue;
          const message = isRecord(choice.message) ? choice.message : null;
          const content = message && Array.isArray(message.content) ? message.content : [];
          for (const item of content) {
            if (isRecord(item) && typeof item.image === "string" && item.image.trim()) {
              urls.push(item.image);
            }
          }
        }

        if (urls.length === 0) {
          throw new Error(`There are no images in ${JSON.stringify(data)}`);
        }

        const firstImageResp = await fetch(urls[0]);
        const arrayBuffer = await firstImageResp.arrayBuffer();
        const mimeType = firstImageResp.headers.get("content-type") ?? "image/png";

        return {
          content: [
            {
              type: "text",
              text: `Generated ${urls.length} image(s) with ${parsed.model}`,
            },
            {
              type: "image",
              mimeType,
              data: base64FromBuffer(arrayBuffer),
            },
          ],
          details: {
            model: parsed.model,
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

export function createWeatherFakeTool(): AnyAgentTool {
  return {
    name: "weather_fake_1",
    description:
      "Return deterministic fake weather for a city. Tool-only demo endpoint (distinct from slash commands), never real meteorological data.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        city: {
          type: "string",
          description: "City name, for example 'Beijing' or 'San Francisco'.",
        },
      },
      required: ["city"],
    },
    async execute(_id, params) {
      const city = readCity(params);
      if (!city) {
        return {
          content: [{ type: "text", text: "city is required" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: formatWeather(fakeWeather(city)) }],
      };
    },
  };
}

export default function register(api: OpenClawPluginApi) {
  api.registerTool(createWeatherFakeTool());
  api.registerTool(createTxt2ImgAlyTool());
}
