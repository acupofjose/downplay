FROM node:16-slim

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

RUN node node_modules/esbuild/install.js
RUN npm run build

CMD npx serve dist