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