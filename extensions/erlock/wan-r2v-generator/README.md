# Wan R2V Generator

OpenClaw plugin for DashScope Wan reference-to-video generation.

This plugin provides two tools:

- `create_reference_video_task`
- `get_reference_video_result`

## Config

`apiKey`, `createTaskUrl`, and `taskResultBaseUrl` can be left unset right after install.
Set `apiKey` before calling the tools.

Optional:

- `createTaskUrl`: override the async task creation URL
- `taskResultBaseUrl`: override the task result query base URL

## Tool contracts

### `create_reference_video_task`

- Supported models: `wan2.6-r2v-flash`, `wan2.6-r2v`
- Requires `input_.prompt` and `input_.reference_urls`
- `input_.reference_urls` must use `http://`, `https://`, or `oss://`
- Supports 1 to 5 references, and at most 3 video references (`.mp4`/`.mov`)
- `parameters.audio=false` is only supported by `wan2.6-r2v-flash`
- `parameters` can be an object or a JSON string that parses to an object

### `get_reference_video_result`

- Requires `task_id`
- Returns raw async task payload from DashScope task API

## Development

```bash
pnpm test -- extensions/erlock/wan-r2v-generator/index.test.ts
```
