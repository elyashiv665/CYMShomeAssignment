FROM node:latest
RUN mkdir -p /usr/src/
WORKDIR /usr/src/
COPY ./publishMessage/package.json /usr/src/
COPY ./publishMessage/publishMessage.js /usr/src/
COPY ./utils/ /usr/src/utils/
RUN npm install
CMD ["node", "publishMessage.js"]