import type { AnyAgentTool, OpenClawPluginApi } from "../../src/plugins/types.js";

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
      "properties": {
        "model": {
          "description": "模型名称，例如 qwen-image-max",
          "type": "string"
        },
        "input_": {
          "properties": {
            "messages": {
              "description": "请求内容数组，仅支持单轮对话",
              "items": {
                "properties": {
                  "role": {
                    "const": "user",
                    "description": "消息角色，必须为 user",
                    "type": "string"
                  },
                  "content": {
                    "description": "消息内容数组，仅允许一个 text",
                    "items": {
                      "properties": {
                        "text": {
                          "description": "正向提示词，用于描述期望生成的图像内容、风格和构图。支持中英文，最长800字符。",
                          "maxLength": 800,
                          "type": "string"
                        }
                      },
                      "required": [
                        "text"
                      ],
                      "type": "object"
                    },
                    "maxItems": 1,
                    "minItems": 1,
                    "type": "array"
                  }
                },
                "required": [
                  "role",
                  "content"
                ],
                "type": "object"
              },
              "maxItems": 1,
              "minItems": 1,
              "type": "array"
            }
          },
          "required": [
            "messages"
          ],
          "type": "object",
          "description": "输入基本信息"
        },
        "parameters": {
          "anyOf": [
            {
              "properties": {
                "negative_prompt": {
                  "anyOf": [
                    {
                      "maxLength": 500,
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "description": "反向提示词，最长500字符",
                  "title": "Negative Prompt"
                },
                "size": {
                  "anyOf": [
                    {
                      "enum": [
                        "1664*928",
                        "1472*1104",
                        "1328*1328",
                        "1104*1472",
                        "928*1664"
                      ],
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "description": "输出图像分辨率",
                  "title": "Size"
                },
                "n": {
                  "anyOf": [
                    {
                      "const": 1,
                      "type": "integer"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "description": "生成图像数量，仅支持1",
                  "title": "N"
                },
                "seed": {
                  "anyOf": [
                    {
                      "exclusiveMaximum": 2147483648,
                      "minimum": 0,
                      "type": "integer"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "description": "随机种子，范围[0,2147483647]",
                  "title": "Seed"
                }
              },
              "title": "Parameters",
              "type": "object"
            },
            {
              "type": "null"
            }
          ],
          "default": null,
          "description": "图像生成参数"
        }
      },
      "required": [
        "model",
        "input_"
      ],
      "type": "object"
    },

    async execute(_id, params) {
      try {
        // 1. 检查参数
        // 2. 处理逻辑
      } catch (error) {
        return errorResult(error instanceof Error ? error.message : "txt2img_aly failed");
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
