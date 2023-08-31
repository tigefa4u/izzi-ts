# Connecting Docker with localhost
- To connect docker with host use `docker run --network host -p 6379:6379 --env-file .env.local <tag>`
- To connect with mac hosts, the connection host must be `host.docker.internal`

# While build docker image
- For docker image to run on linux use `--platform=linux/amd64` in `docker build` while building on mac

# To Push image to CANISTER registry
- `docker login --username=<username> cloud.canister.io:5000`
- `docker tag <image> cloud.canister.io:5000/<username>/<repo>:latest`
- `docker push cloud.canister.io:5000/<username>/<repo>`