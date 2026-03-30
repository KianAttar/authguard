FROM node:alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# ENV NODE_DEBUG=http,https
RUN corepack enable

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .

RUN pnpm install
# --prod equavalant to --omit=dev on npm

COPY . .

CMD [ "pnpm", "run", "start" ]