FROM node:16

WORKDIR /app/nodejs
COPY ./nodejs/package.json ./nodejs/package-lock.json ./
RUN npm ci

COPY . /app

ENTRYPOINT ["npm", "run", "start", "--"]
CMD ["--configuration-file=../config.txt", "-v"]