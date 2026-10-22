---
title: MCP Server
description: Connect AI apps like Claude Code and Cursor to Kinopio, so they can read and edit your spaces, cards, boxes, lists, connections, and tags
category: Importing and Exporting
updated: 2026-10-22
image: ''
---

# MCP Server

Connect AI apps like Claude Code and Cursor to Kinopio, so they can read and edit your spaces, cards, boxes, lists, connections, and tags.

[MCP](https://modelcontextprotocol.io) (Model Context Protocol) is the standard way for AI apps to use other tools. Once connected, you can ask your AI to do things like

- "Summarize what's in my Inbox"
- "Find all my cards tagged #todo and group them into a list"
- "Turn these meeting notes into a new space, with a card for each idea"

## 1. Create an App API Key

In `User Settings → General → API`, click `New` to create an [App API Key](/help/third-party-apps). Name it after the app you're connecting (e.g. Claude Code), and pick the narrowest scope that does what you need:

- **Read** lets the AI see your spaces and cards, but not change anything
- **Edit** also lets it create and update cards, spaces, boxes, and more
- **Delete** also lets it remove things

If you're not sure, start with **Read**. You can always make another key later.

## 2. Connect your AI app

The MCP Server address is

```
https://mcp.kinopio.club/mcp
```

Your App API Key is sent with every request as an `Authorization: Bearer` header.

### Claude Code

Run this in your terminal, replacing `YOUR_APP_API_KEY` with your key

```shell
claude mcp add --transport http kinopio https://mcp.kinopio.club/mcp --header "Authorization: Bearer YOUR_APP_API_KEY"
```

### Cursor and other apps

Apps that are set up with JSON, like Cursor, take the address and header like this

```json
{
  "mcpServers": {
    "kinopio": {
      "url": "https://mcp.kinopio.club/mcp",
      "headers": { "Authorization": "Bearer YOUR_APP_API_KEY" }
    }
  }
}
```

### Claude.ai and the Claude desktop app

Coming soon. Custom connectors in Claude.ai and the Claude desktop app currently need sign-in with OAuth, which Kinopio doesn't support yet.

## Revoking Access

To disconnect an app, delete its App API Key in `User Settings → General → API`. It'll stop working right away.

## Privacy

The MCP Server doesn't store your API key or any of your content. Each request passes your key straight through to the [Kinopio API](/api), and nothing is saved in between.

## Pro-Tips

Kinopio's API allows up to 5 requests per second, so big changes, like editing hundreds of cards, can take a little while. The MCP Server spaces out requests for you, so you don't have to worry about it.

If you have questions or ideas for what the MCP Server should do, the best place to ask is in the community [Discord](/discord) or the [Forums](/forum).
