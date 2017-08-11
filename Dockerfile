FROM quay.io/byuoit/node-oracledb
LABEL maintainer = Daniel Hancock <daniel_hancock@byu.edu>
WORKDIR /usr/src/
ADD . .
EXPOSE 3000
RUN apt-get update
RUN apt-get install git -y
RUN apt-get install build-essential -y
RUN apt-get clean
RUN npm install
CMD node index.js