# Fetch URL

OpenClaw plugin that provides a `fetch_url` tool backed by a browser MCP server over Streamable HTTP.

## Config

Set `pluginConfig.mcpUrl` to your browser MCP endpoint if you do not want the default `http://localhost:8931/mcp`.

## Tool contract

- Tool name: `fetch_url`
- Required input: `url`
- Optional input: `wait_for_render`, `screenshot_path`
- `wait_for_render` defaults to `8` seconds and must be between `0` and `60`
- `screenshot_path` saves a full-page PNG on the local filesystem

## Development

```bash
pnpm test -- extensions/erlock/fetch-url/index.test.ts
```
