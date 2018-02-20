FROM node:8.9.4

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Set env args
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install && npm cache clean

# Bundle app source
COPY . /usr/src/app

CMD [ "npm", "start" ]