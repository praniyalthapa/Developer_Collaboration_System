FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Language runtimes for the pair-programming "Run" button (CODE_EXECUTION_ENABLED).
# JavaScript runs in a browser worker, but python/java/go/typescript are spawned
# here by src/services/execute.service.ts, so those binaries must exist in the
# image. openjdk21-jdk (not -jre) is required: `java Main.java` single-file source
# launch compiles on the fly and needs the compiler.
RUN apk add --no-cache python3 openjdk21-jdk go
# go build/module caches default to $HOME and must be writable at run time.
ENV GOCACHE=/tmp/go-build \
    GOPATH=/tmp/go \
    GOFLAGS=-mod=mod

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN mkdir -p uploads
EXPOSE 7777
CMD ["sh", "-c", "if [ \"$RUN_SEED\" = \"true\" ]; then node dist/seed/index.js; fi; node dist/server.js"]
