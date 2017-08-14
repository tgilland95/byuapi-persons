FROM quay.io/byuoit/node-oracledb

RUN apt-get update
RUN apt-get install git -y
RUN apt-get install build-essential -y
RUN apt-get clean

RUN npm install -g n
RUN n 8.3.0

RUN mkdir /app
WORKDIR /app
ADD . .

EXPOSE 3000

RUN npm install

CMD [ "node","index.js"]
