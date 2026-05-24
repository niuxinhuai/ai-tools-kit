FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY bin ./bin
COPY docs ./docs
COPY public ./public
COPY server ./server
COPY src ./src
COPY tests ./tests
COPY tools ./tools
COPY README.md README.zh-CN.md LICENSE ./

ENV NODE_ENV=production
ENV PORT=5177

EXPOSE 5177

CMD ["node", "server/index.js"]
