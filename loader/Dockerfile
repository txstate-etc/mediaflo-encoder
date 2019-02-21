FROM node:10-alpine
RUN apk update && apk upgrade
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --quiet --production
COPY index.js ./
COPY lib lib
COPY routes routes
COPY presets.json presets.json
CMD ["npm", "start"]
