FROM node:boron-slim
COPY /flickrmap .
EXPOSE 3000
RUN npm install
CMD npm start