# Connecting Docker with localhost
- To connect docker with host use `docker run --network host -p 6379:6379 --env-file .env.local <tag>`
- To connect with mac hosts, the connection host must be `host.docker.internal`

# While build docker image
- For docker image to run on linux use `--platform=linux/amd64` in `docker build` while building on mac

# Installing docker on ubuntu
- read https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04

# Installing redis on ubuntu
- Only run `sudo apt install redis-server`
- `sudo nano /etc/redis/redis.conf` to configure password etc

# To Push image to CANISTER registry
- `docker login --username=<username> cloud.canister.io:5000`
- `docker tag <image> cloud.canister.io:5000/<username>/<repo>:latest`
- `docker push cloud.canister.io:5000/<username>/<repo>`

# Useful tools
- `dive` is a useful tool to check docker image size to see where the huge files are