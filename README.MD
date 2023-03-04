########### IZZI DISCORD BOT ################
#All you need to know

# IMPORTANT
INSTALL BETTER SQLITE3 on UBUNTU
sudo apt-get install build-essential

forever start -c "node -r dotenv/config --max-old-space-size=7024" -o out.log -e error.log lib/server/shard.js

pkill -9 -f client.js

REMEMBER TO CLEAR REDIS FROM BOTH SERVERS TO STOP EVENT
- USE OLD PROJECT TO CREATE NEW MIGRATIONS
- While installing canvas on ubuntu run the command "sudo npm config set user 0"
- use sudo curl -sL https://deb.nodesource.com/setup_12.x | sudo bash - (to install node v12)
- use nohup java -jar Lavalink.jar & to run lavalink deamon
- Need to make sure to stop all other node preocesses running by shards (use "top" command to get all processes)
- use ps -e | grep node (need to kill all sharded processes manually, forever wont stopall)
- use ps -aef | grep node to see the paths of running node process
- need to sudo apt install redis-server
- sudo forever start -c "node --max-old-space-size=8024" -o out.log -e error.log server/shard.js  
(run this to make node utilize more RAM)
- set ``NODE_PATH=src`` in env for typescript module short imports

# Used GCS to store images
- Install skipper-gcstorage if using sails
- ran a script to upload all cards. there are some cards that dont get upload, need to do them manually
- To move images between VMs use tar

# Configuring SSL for NginX with LetsEncrypt
- sudo apt-get update
- sudo apt-get install certbot
- sudo apt-get install python3-certbot-nginx
- configure nginx proxies to redirect with the domain name
- sudo certbot -d domain.com -d www.domain.com (you dont need the www for sub domains, run this to make https redirect)

# configuring ELK Stack
- refer https://gitlab.com/LabIT/elasticsearch/-/blob/master/elk_manual_configuration/elastic_manual_install.md
- refer https://www.elastic.co/guide/en/elasticsearch/reference/current/deb.html
- wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
- sudo apt-get install apt-transport-https -y
- echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-7.x.list
- sudo apt-get update && sudo apt-get install elasticsearch && sudo apt-get install logstash && sudo apt-get install kibana
- configure elastic search on the path /etc/elasticsearch/elasticsearch.yml
- Best playlist for ELK stack https://www.youtube.com/playlist?list=PLPTVUNBUcmpm1rm4yyL0zE0KePL6t14Y3
- filebeat -v -e -d "*" command to check systemctl errors
# Notes
- Create views for optimizing queries and check out pool size numbers, no point in using 2000 pool size with 2 cpus.
- Use picture tag and convert jpg images to webp
- Need to normalize collections and ranks table with rank id from ranks table and replacing the "ranks" with the ids

- sudo apt-get install build-essential (run this command before installing heapdump)

# STEPS TO PERFORM WHEN POSTGRES LOGS ARE FULL
- df -h
(delete the log files in the postgres location)
# pg cluster restart command
- sudo chmod 700 -R /var/lib/postgresql/13/main
- sudo -i -u postgres
- postgres@abc:~$ /usr/lib/postgresql/13/bin/pg_ctl restart -D /var/lib/postgresql/13/main
- remove logs from path (var/log/postgresql/)

# IMPORTANT TO START THE APP
- if absolute imports don't work use ``export NODE_PATH=src/`` before ``npm run dev``
- To start the compiled js app use ``export NODE_PATH=lib/`` before ``npm start``
- The app requires ``-r dotenv/config path/to/file`` to run

# CRONJOBS
- Izzi server - premium job
- izzi test server - mana, premium and normal raid permit refill
- izzi dashboard - minute & raid energy refill

# DATABASE BACKUP
- remove database logs using cronjob ``rm /var/log/postgresql/*``
- run db-backup.sh in cronjob to create backups at intervals
# Improve DB Performance
- run 'vacuum' command regularly to speed up index-only scans. It reduces the heap size
- There are two variants of VACUUM: standard VACUUM and VACUUM FULL. VACUUM FULL can reclaim more disk space but runs much more slowly. Also, the standard form of VACUUM can run in parallel with production database operations. (Commands such as SELECT, INSERT, UPDATE, and DELETE will continue to function normally, though you will not be able to modify the definition of a table with commands such as ALTER TABLE while it is being vacuumed.) VACUUM FULL requires an ACCESS EXCLUSIVE lock on the table it is working on, and therefore cannot be done in parallel with other use of the table. Generally, therefore, administrators should strive to use standard VACUUM and avoid VACUUM FULL.
``
SELECT
  schemaname, relname,
  last_vacuum, last_autovacuum,
  vacuum_count, autovacuum_count
FROM pg_stat_user_tables;
``
