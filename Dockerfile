FROM node:17.5.0-alpine

WORKDIR /app
COPY [ "package.json",  "./" ]
COPY [ "package-lock.json",  "./" ]
RUN npm install
COPY . .
CMD [ "node", "index.js" ]