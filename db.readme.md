# To create Database backup super fast
- login as postgres user `su - postgres`
- `pg_dump -F c -d izzi -f <filename>.backup`

# Important Note
- Before restoring You must create `cloudsqlsuperuser` role.
- Navigate to pg_admin in the database options choose `psql tool`.
- run `create role cloudsqlsuperuser login;`

# To restore file
- login as postgres user `su - postgres`
- when you move the file to remote server you must allow postgres to own the backup file. first move the file to `/var/lib/postgresql/`, then type `chown postgres:postgres <pathtofile>`
- `pg_restore -d izzi -j 4(jobs) <backfile.backup>`

# CRONJOBS (izzi db server vultr)
#0 */6 * * * /var/lib/postgresql/backup.sh
#0 */12 * * * rm /var/log/postgresql/*
#0 0 * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job premium >> /home/izzi-ts/cronjob.log 2>&1
#0 0 * * * export NODE_PATH=src/ && npx ts-node -r dotenv/config /home/izzi-ts/src/server/pipes/cronjobs/dailyTimer.ts
#*/3 * * * * export NODE_PATH=src/ && npx ts-node -r dotenv/config /home/izzi-ts/sc/server/pipes/cronjobs/voteReminderTimer.ts

# CRONJOBS (dashboard server)
##*/5 * * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job minute >> /home/izzi-ts/cronjob.log 2>&1
*/4 * * * * export NODE_PATH=src/ && /home/izzi-cronjobs/cronjob.sh -job 4minute >> /home/izzi-cronjobs/cronjob.log 2>&1
*/5 * * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job hour >> /home/izzi-ts/cronjob.log 2>&1
##0 0 * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job premium >> /home/izzi-ts/cronjob.log 2>&1
0 */2 * * * export NODE_PATH=src/ && /home/izzi-cronjobs/cronjob.sh -job rp >> /home/izzi-cronjobs/cronjob.log 2>&1
0 0-21/3 * * * export NODE_PATH=src/ && /home/izzi-cronjobs/cronjob.sh -job rpp >> /home/izzi-cronjobs/cronjob.log 2>&1
30 1-22/3 * * * export NODE_PATH=src/ && /home/izzi-cronjobs/cronjob.sh -job rpp >> /home/izzi-cronjobs/cronjob.log 2>&1
*/5 * * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job minute >> /home/izzi-ts/cronjob.log 2>&1
*/4 * * * * export NODE_PATH=src/ && /home/izzi-ts/cronjob.sh -job 4minute >> /home/izzi-ts/cronjob.log 2>&1

## NOTE: Some cronjobs are written in a different repo `izzi-cronjobs`