FROM node:boron-slim
COPY /flickrmap .
EXPOSE 80
RUN npm install
CMD npm start