- Optimized Table query with 23million data
- Reduced query execution time from more than 10secs - 18secs to 2secs on average for users containing 400k rows

Use ``export NODE_PATH=src`` if you get short import exceptions
Use ``set NODE_PATH=src/`` on windows

CRONJOBS -----
*/5 * * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job minute >> /home/izzi-ts/cronjob.log 2>&1         
*/4 * * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job 4minute >> /home/izzi-ts/cronjob.log 2>&1
0 */1 * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job hour >> /home/izzi-ts/cronjob.log 2>&1
0 0 * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job premium >> /home/izzi-ts/cronjob.log 2>&1
0 */2 * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job rp >> /home/izzi-ts/cronjob.log 2>&1
0 0-21/3 * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job rpp >> /home/izzi-ts/cronjob.log 2>&1
30 1-22/3 * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job rpp >> /home/izzi-ts/cronjob.log 2>&1

canvas draw using requestAnimationFrame
- check how long it takes for it to paint 1000 ele from array
- compress images to send in embeds. inflation / deflation

# Logger Context example
import { createNamespace } from "cls-hooked";
import { REQUEST_CONTEXT } from "../../helpers/constants";

const session = createNamespace(REQUEST_CONTEXT);

export interface RequestContext {
  trackingId?: string;
  userId?: string;
  requestId: string;
  userEmail?: string;
  feature: string;
  startTime: number;
}

export function getSession() {
  return session;
}

export function initRequestContext(initFn) {
  return session.run(() => {
    initFn();
  });
}

export function getRequestContext(): RequestContext {
  return session.get(REQUEST_CONTEXT) || {};
}

export function setRequestContext(context: RequestContext) {
  return session.set(REQUEST_CONTEXT, context);
}

export function getRequestContextForHeader() {
  const context = getRequestContext();
  return {
    "x-user-id": context.userId,
    "x-platform-id": context.trackingId,
    "x-request-id": context.requestId,
    "x-email-id": context.userEmail,
  };
}
app.use(async (req: FastifyRequest, _res: FastifyReply, next) => {
    initRequestContext(async () => {
      const requestId = (req.headers["x-request-id"] || (await nanoid())) as string;
      req.headers["x-request-id"] = requestId;
      const userId = req.headers["x-user-id"] as string;
      const trackingId = req.headers["x-platform-id"] as string;
      const userEmail = req.headers["x-email-id"] as string;
      const feature = req.url.replace("/api/v1/", "")?.split("?")[0];
      setRequestContext({
        trackingId,
        userId,
        requestId,
        userEmail,
        feature,
        startTime: Date.now(),
      });
      const { method, url, headers } = req;
      logger.log("[MIDDLEWARE] Request Started", { method, url, headers });
      next();
    });
  });