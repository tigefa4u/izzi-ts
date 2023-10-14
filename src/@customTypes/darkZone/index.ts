import { BaseProps } from "@customTypes/command";
import { DarkZoneProfileProps } from "./profile";

export type DzFuncProps = BaseProps & { dzUser: DarkZoneProfileProps; };