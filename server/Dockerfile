FROM node:16-buster

WORKDIR /app

RUN apt update && apt install ffmpeg -y

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

RUN npm run generate:schema

CMD npm run start