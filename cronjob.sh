#!/bin/bash

cd $(dirname "$0")
job=$2
if [[ $1 != "-job" || -z $job ]]
then
    echo "invalid arguments provided"
    echo "Valid Args"
    echo "-job <name>   Job to execute"
elif [[ $job == "minute" ]]
then
    echo "executing one minute jobs ###"
    echo $(date -u)
    npx ts-node -r dotenv/config src/server/pipes/cronjobs/oneMinuteTimers.ts
    echo "one minute jobs completed.."
elif [[ $job == "4minute" ]]
then
    echo "executing four minute jobs ###"
    echo $(date -u)
    npx ts-node -r dotenv/config src/server/pipes/cronjobs/fourMinuteTimers.ts
    echo "four minute jobs completed.."
elif [[ $job == "hour" ]]
then
    echo "executing hourly jobs ###"
    echo $(date -u)
    npx ts-node -r dotenv/config src/server/pipes/cronjobs/hourlyTimers.ts
    echo "one hour jobs completed.."
elif [[ $job == "premium" ]]
then
    echo "executing premium jobs ###"
    echo $(date -u)
    npx ts-node -r dotenv/config src/server/pipes/cronjobs/premiumTier.ts
    echo "premium jobs completed.."
elif [[ $job == "rp" ]]
then
    echo "executing raid permit jobs ###"
    echo $(date -u)
    npx ts-node -r dotenv/config src/server/pipes/cronjobs/raidPermitRefill.ts
    echo "raid permit refill jobs completed.."
elif [[ $job == "rpp" ]]
then
    echo "executing raid premium permit jobs ###"
    echo $(date -u)
    npx ts-node -r dotenv/config src/server/pipes/cronjobs/raidPermitPremiumRefill.ts
    echo "raid premium permit refill jobs completed.."
elif [[ $job == "cdr" ]]
then
    echo "executing card cooldown reset jobs ###"
    echo $(date -u)
    npx ts-node -r dotenv/config src/server/pipes/cronjobs/resetCardCooldown.ts
    echo "card cooldown reset jobs completed..."
fi
exit 0