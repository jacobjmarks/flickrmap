FROM node:boron-slim
COPY /flickrmap /flickrmap
WORKDIR /flickrmap
EXPOSE 80
CMD npm install && npm start