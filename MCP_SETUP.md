# Supabase MCP Server Setup

This project is configured to use the Supabase Model Context Protocol (MCP) server for enhanced database interactions.

## Configuration

The MCP server configuration is stored in `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=taswmdahpcubiyrgsjki"
    }
  }
}
```

## Using with Claude Code

### Option 1: Automatic Detection (Recommended)
Claude Code should automatically detect the `.mcp.json` file in the project root and use the configured MCP servers.

### Option 2: Manual Configuration
If automatic detection doesn't work, you can manually add the MCP server to your Claude Code settings:

1. Open your Claude Code settings file (usually located at `~/.config/claude/claude_desktop_config.json`)
2. Add the Supabase MCP server configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=taswmdahpcubiyrgsjki"
    }
  }
}
```

3. Restart Claude Code to apply the changes

## What is MCP?

The Model Context Protocol (MCP) allows Claude to interact directly with external systems like databases, APIs, and tools. The Supabase MCP server enables Claude to:

- Query your Supabase database
- Fetch table schemas and data
- Execute SQL queries (with appropriate permissions)
- Interact with Supabase features directly

## Project Reference

This configuration connects to the Supabase project: `taswmdahpcubiyrgsjki`

## Security Note

The MCP server URL is specific to your Supabase project. Keep this configuration file private if your project contains sensitive data.
