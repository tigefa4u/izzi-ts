# Database name
db_name=izzi
db_user=postgres
db_pass=xpABU82b001hQShini5TEwpkAyR
db_host=127.0.0.1

# Backup storage directory 
backupfolder=~/postgresql/backups

# Notification email address 
recipient_email=krhoax7@gmail.com

# Number of days to store the backup 
keep_day=7

sqlfile=$backupfolder/izzi-$(date +%d-%m-%Y_%H-%M-%S).sql
zipfile=$backupfolder/izzi-$(date +%d-%m-%Y_%H-%M-%S).zip

#create backup folder
mkdir -p $backupfolder

#create temp credentials file
creds=".pgpass"
echo "*:*:$db_name:$db_user:$db_pass" > $creds
chmod 600 $creds

export PGPASSFILE=$creds
# Create a backup

if pg_dump -h $db_host -U $db_user -w -Fc $db_name > $sqlfile ; then
   echo 'Sql dump created'
else
   echo 'pg_dump return non-zero code' | mailx -s 'No backup was created!' $recipient_email
   exit
fi

# Compress backup 
if gzip -c $sqlfile > $zipfile; then
   echo 'The backup was successfully compressed'
else
   echo 'Error compressing backup' | mailx -s 'Backup was not created!' $recipient_email
   exit
fi

rm $creds
rm $sqlfile 
echo $zipfile | mailx -s 'Backup was successfully created' $recipient_email

# Delete old backups 
find $backupfolder -mtime +$keep_day -delete