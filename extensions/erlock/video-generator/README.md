# Video Generator

OpenClaw plugin that provides two DashScope Wan video tools:

- `creat_video_gen_task`
- `get_video_gen_result`

## Config

You must set `apiKey` in plugin config (`api.pluginConfig`).

Optional:

- `createTaskUrl`: override the DashScope create-task endpoint
- `taskResultBaseUrl`: override the DashScope task query base URL

## Tool contracts

### `creat_video_gen_task`

- Supported model: `wan2.6-i2v-flash`
- Requires `input_.img_url`
- Supports optional `input_.template` for video effect template name
- `input_.img_url` and `input_.audio_url` (if provided) must start with one of: `http://`, `https://`, `oss://`, `data:`
- `parameters` can be an object or a JSON string that parses to an object

### `get_video_gen_result`

- Requires `task_id`
- Returns raw task status/result payload from DashScope task API

## Development

```bash
pnpm test -- extensions/erlock/video-generator/index.test.ts
```
