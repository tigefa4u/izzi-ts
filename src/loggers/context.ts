import { createNamespace } from "cls-hooked";
import { LOGGER_CONTEXT } from "helpers/constants/constants";

/**
 * cls hooked uses call stack to map each context
 * to that call stack to maintain uniqueness.
 * So the interface set does not change with multiple
 * requests
 */
const ctx = createNamespace(LOGGER_CONTEXT);

interface LoggerContext {
  requestId: string;
  userTag: string;
  serverId?: string;
  channelId?: string;
}

export const getLoggerContext = (): LoggerContext =>
	ctx.get(LOGGER_CONTEXT) || {};

export const setLoggerContext = (context: LoggerContext) =>
	ctx.set(LOGGER_CONTEXT, context);

export const initLoggerContext = (cb: () => void) => {
	return ctx.run(() => cb());
};
