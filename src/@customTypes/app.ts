import { Client } from "discord.js";

export type AppProps = {
    handleClientEvents: (client: Client) => void;
    handleClient: (client: Client) => void;
}