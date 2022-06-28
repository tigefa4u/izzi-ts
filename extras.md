# CREATE A GUILD INFO MATERIALIZED VIEW

```select 'leader' as role, g.guild_id, g.user_id, u.user_tag, u.username from guild_members as g
inner join users u on g.user_id = u.id
where g.is_leader = true union
select 'vice_leader' as role, g.guild_id, g.user_id, u.user_tag, u.username from guild_members as g
inner join users u on g.user_id = u.id
where g.is_vice_leader = true```

create index guild on guild_details (guild_id)

REFRESH MATERIALIZED VIEW guild_details // refresh to update the view

(select 'members' as type, count(*) as member_count from guild_members where guild_id = 2695) union
(select 'iems' as type, count(*) as item_count from guild_items where guild_id = 2695)

select count(*) from guild_members where is_leader = true

select * from guild_details as x where x.user_id = 54

create materialized view guild_details as select 'leader' as role, g.guild_id, g.user_id, u.user_tag, u.username from guild_members as g
inner join users u on g.user_id = u.id
where g.is_leader = true union
select 'vice_leader' as role, g.guild_id, g.user_id, u.user_tag, u.username from guild_members as g
inner join users u on g.user_id = u.id
where g.is_vice_leader = true

create index guild on guild_details (guild_id)

REFRESH MATERIALIZED VIEW guild_details

create index guild on guild_members (guild_id)

(select 'members' as type, count(*) as member_count from guild_members where guild_id = 2695) union
(select 'iems' as type, count(*) as item_count from guild_items where guild_id = 2695)

select count(*) from guild_members where is_leader = true

select * from guild_details as x where x.user_id = 54

select * from guild_members where user_id = 54

## CREATE MATERIALIZED VIEW
create materialized view guild_details as select 'leader' as role, g.guild_id, g.user_id, u.user_tag, u.username from guild_members as g
inner join users u on g.user_id = u.id
where g.is_leader = true union
select 'vice_leader' as role, g.guild_id, g.user_id, u.user_tag, u.username from guild_members as g
inner join users u on g.user_id = u.id
where g.is_vice_leader = true union
select 'admin' as role, g.guild_id, g.user_id, u.user_tag, u.username from
guild_members as g
innjer join users u in g.user_id = u.id
where g.is_admin = true

create index guild on guild_details (guild_id)

REFRESH MATERIALIZED VIEW guild_details

create index guild_member_idx on guild_members (guild_id, user_id)

create index collection_mk_idx on collections (id, is_on_market, is_item)
select * from collections limit 1
create index character_name_type_idx on characters (name, type)

select * from guilds where metadata is not null

JSON Query in where clause

select *, lobby->'1' as member from raids
 where (lobby->'1'->'user_id')::int = 1

SELECT schemaname, indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname; 