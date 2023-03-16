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


  # INCASE MIGRATION FAILS ADD THIS FILE
  - Created Migration: /Users/hoax/Desktop/izzi/izzi-ts/src/db/migrations/20230113110055_rename-dungeons-table.ts


  # Current Quests
- const quests = [
    {
        name: "Complete 2 Raid Challenges",
        description: "Participate & complete 2 raid challenges of any difficulty by battling the raid boss",
        difficulty: "EASY",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 3000,
                emoji: "gold"
            }
        },
        criteria: {
            toComplete: 2,
            isAnyDifficulty: true
        },
        min_level: 1,
        max_level: 22,
        is_daily: true,
        type: "RAID_CHALLENGE"
    },
    {
        name: "Solo Leveling",
        description: "Level up a card using ``Enchantment`` command __(increase level by 1)__",
        difficulty: "EASY",
        reward: {
            gold: {
                key: "gold",
                amount: 1000,
                name: "gold",
                emoji: "gold"
            }
        },
        criteria: {
            incrementLevelBy: 1
        },
        min_level: 1,
        max_level: 22,
        is_daily: true,
        type: "CARD_LEVELING"
    },
    {
        name: "Explorer",
        description: "Visit atleast 1 page on the website (spend atleast 10 seconds on the page)",
        difficulty: "EASY",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 1500,
                emoji: "gold"
            }
        },
        criteria: {
            pages: 1
        },
        min_level: 1,
        max_level: 22,
        is_daily: true,
        type: "WEBPAGES"
    },
    {
        name: "Complete 4 Raid Challenges",
        description: "Participate & complete 4 raid challenges of any difficulty by battling the raid boss",
        difficulty: "MEDIUM",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 7000,
                emoji: "gold"
            }
        },
        criteria: {
            toComplete: 4,
            isAnyDifficulty: true
        },
        min_level: 23,
        max_level: 60,
        is_daily: true,
        type: "RAID_CHALLENGE"
    },
    {
        name: "Solo Leveling",
        description: "Level up a card using ``Enchantment`` command __(increase level by 20)__",
        difficulty: "MEDIUM",
        reward: {
            gold: {
                amount: 3000,
                key: "gold",
                name: "gold",
                emoji: "gold"
            }
        },
        criteria: {
            incrementLevelBy: 20
        },
        min_level: 23,
        max_level: 60,
        is_daily: true,
        type: "CARD_LEVELING"
    },
    {
        name: "Wanderer",
        description: "Visit atleast 4 pages on the website",
        difficulty: "MEDIUM",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 4000,
                emoji: "gold"
            }
        },
        criteria: {
            pages: 4
        },
        min_level: 23,
        max_level: 60,
        is_daily: true,
        type: "WEBPAGES"
    },
    {
        name: "Trader",
        description: "Trade any 1000 cards from your inventory with another player (in one trade)",
        difficulty: "MEDIUM",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 8000,
                emoji: "gold"
            }
        },
        criteria: {
            cardsToTrade: 1000
        },
        min_level: 23,
        max_level: 60,
        type: "TRADING"
    },
    {
        name: "The Carry",
        description: "Complete 1 Immortal Raid Challenge as the MVP player with most damage dealt",
        difficulty: "MEDIUM",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 10000,
                emoji: "gold"
            },
            cards: {
                key: "card",
                name: "cards",
                amount: 1,
                description: "Receive 1 Immortal Card of any 1 of the current raid bosses",
                rank: "immortal"
            }
        },
        criteria: {
            toComplete: 1,
            difficulty: "immortal",
            isMvp: true
        },
        min_level: 23,
        max_level: 60,
        type: "RAID_CARRY"
    },
    {
        name: "Wanderer",
        description: "Visit atleast 4 pages on the website",
        difficulty: "MEDIUM",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 5000,
                emoji: "gold"
            }
        },
        criteria: {
            pages: 4
        },
        min_level: 61,
        max_level: 1000,
        is_daily: true,
        type: "WEBPAGES"
    },
    {
        name: "Complete 6 Immortal Raid Challenges",
        description: "Participate & complete 6 raid challenges of Immortal difficulty by battling the raid boss",
        difficulty: "HARD",
        reward: {
            gold: {
                key: "gold",
                amount: 12000,
                name: "gold",
                emoji: "gold"
            },
            raid_pass: {
                key: "raid_pass",
                name: "raid permit(s)",
                amount: 1,
                emoji: "permit"
            }
        },
        criteria: {
            toComplete: 6,
        },
        min_level: 61,
        max_level: 1000,
        is_daily: true,
        type: "RAID_CHALLENGE"
    },
    {
        name: "Solo Leveling",
        description: "Level up a card using ``Enchantment`` command upto max level",
        difficulty: "HARD",
        reward: {
            gold: {
                key: "gold",
                amount: 8000,
                name: "gold",
                emoji: "gold"
            },
            orbs: {
                key: "orbs",
                name: "orbs",
                amount: 100,
                emoji: "blueorb"
            }
        },
        criteria: {
            maxlevel: true
        },
        min_level: 61,
        max_level: 1000,
        is_daily: true,
        type: "CARD_LEVELING"
    },
    {
        name: "Global Trader",
        description: "Sell an immortal card for atleast 1,200,000 gold on the Global Market",
        difficulty: "HARD",
        reward: {
            gold: {
                key: "gold",
                amount: 50000,
                name: "gold",
                emoji: "gold"
            }
        },
        criteria: {
            rank: "immortal",
            mingold: 1200000
        },
        min_level: 61,
        max_level: 1000,
        type: "MARKET"
    },
    {
        name: "The Carry",
        description: "Complete 1 Immortal Raid Challenge as the MVP player with most damage dealt & least number of attacks",
        difficulty: "HARD",
        reward: {
            gold: {
                key: "gold",
                name: "gold",
                amount: 10000,
                emoji: "gold"
            },
            cards: {
                key: "card",
                name: "cards",
                amount: 2,
                description: "Receive 2 Immortal Cards of any 1 of the current raid bosses",
                rank: "Immortal"
            }
        },
        criteria: {
            toComplete: 1,
            difficulty: "immortal",
            isMvp: true,
            isLeastAttacks: true
        },
        min_level: 61,
        max_level: 1000,
        type: "RAID_CARRY"
    },
]