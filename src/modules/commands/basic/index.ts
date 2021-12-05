import { BaseProps } from "../../../@types/command"

export const ping = async ({ message, client }: BaseProps) => {
  message.channel.sendMessage(
    `:ping_pong: Ping: **\`\`${
      Date.now() - message.createdTimestamp
    }ms\`\`** WS: **\`\`${Math.round(client.ws.ping)}ms\`\`**`
  )
  return
}
export const invite = async ({ message, client }: BaseProps) => {
  return ""
}
