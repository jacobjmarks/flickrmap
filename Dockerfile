FROM node:6.11.2-slim
COPY /flickrmap /flickrmap
WORKDIR /flickrmap
EXPOSE 80
CMD npm install && npm start