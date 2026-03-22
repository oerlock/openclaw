# Image Generator

OpenClaw plugin that provides an `image_generator` tool for DashScope Qwen image generation and editing.

## Config

Set `pluginConfig.apiKey` to your DashScope API key.

Optional:

- `pluginConfig.baseUrl`: override the default DashScope endpoint

## Tool contract

- Tool name: `image_generator`
- Supported models: `qwen-image-2.0`, `qwen-image-2.0-pro`
- `input_.messages` supports one `user` message only
- The message content must contain exactly one `text` item and up to three `image` items
- `parameters` can be an object or a JSON string that parses to an object
- Valid image references start with `http://`, `https://`, `oss://`, or `data:`

## Development

```bash
pnpm test -- extensions/erlock/image-generator/index.test.ts
```
