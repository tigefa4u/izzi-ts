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