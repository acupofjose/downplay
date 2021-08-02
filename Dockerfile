FROM node:16-buster

WORKDIR /app

RUN apt update && apt install ffmpeg libmp3lame-dev -y

# Server
COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

# Client
RUN yarn --cwd ./client install

# Server
CMD yarn generate:schema && yarn start