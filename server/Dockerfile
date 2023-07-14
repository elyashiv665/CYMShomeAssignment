FROM node:latest
RUN mkdir -p /usr/src/
WORKDIR /usr/src/
COPY ./package.json /usr/src/
COPY ./server.js /usr/src/
COPY ./utils/ /usr/src/utils/
RUN npm install
CMD ["node", "server.js"]