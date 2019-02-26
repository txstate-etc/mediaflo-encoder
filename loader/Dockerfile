FROM node:10-alpine
RUN apk update && apk upgrade &&\
	apk add openssl &&\
	mkdir /securekeys &&\
	openssl genrsa -out /securekeys/private.key 4096 &&\
	openssl req -new -x509 -key /securekeys/private.key -out /securekeys/cert.pem -sha256 -days 3650 -subj '/CN=localhost'
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --quiet --production
COPY index.js ./
COPY lib lib
COPY routes routes
COPY presets.json presets.json
CMD ["npm", "start"]
