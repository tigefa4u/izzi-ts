import { Client, Message } from "discord.js";

export type BaseProps = {
    message: Message;
    client: Client;
}