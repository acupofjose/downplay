FROM node:16-buster

WORKDIR /app

RUN apt update && apt install ffmpeg libavcodec-extra-53 -y

# Server
COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

# Client
RUN yarn --cwd ./client install

# Server
RUN yarn generate:schema
CMD yarn start