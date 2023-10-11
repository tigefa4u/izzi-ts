#!/bin/bash
source .env.deploy

if [ -z "$tokenclone" ]; then
  echo "The variable 'tokenclone' is not set or is empty in '.env.deploy' file."
  exit 1
elif [ -z "$username" ]; then
  echo "The variable 'username' is not set or is empty in '.env.deploy' file."
  exit 1
elif [ -z "$host" ]; then
  echo "The variable 'host' is not set or is empty in '.env.deploy' file."
  exit 1
fi

gitpull="git pull https://HoaX7:${tokenclone}@github.com/HoaX7/izzi-ts"
pullcomplete="echo Code updated with latest changes..."
dockerbuild="docker build -t izzi ."
dockerlist="docker container ls"
# Stop current container
execute="echo Enter the name or ID of the Docker container to stop and remove: && \
read id && echo Stopping and Removing container \$id && \
docker container stop \$id && docker container rm \$id"

clearBattleCache="export NODE_PATH=src/ && npm run flush:cooldown"

# -v ./imagecache.sqlite:/app/imagecache.sqlite \
dockerrun="docker run -v ./izzi-cloud-logging.json:/app/izzi-cloud-logging.json \
-v ./izzi-task-queue.json:/app/izzi-task-queue.json \
-d --restart unless-stopped -p 6379:6379 \
--env-file .env --network host --memory=5g izzi && docker stats"

cmd="cd ../home/izzi-ts && ${gitpull} && ${pullcomplete} && ${dockerbuild} && \
${dockerlist} && ${execute} && ${clearBattleCache} && ${dockerrun}"

read -s -p "Enter password for $username@$host: " password
sshpass -p $password ssh -l $username $host "$cmd"
