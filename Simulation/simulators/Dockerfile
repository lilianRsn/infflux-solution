FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY shared ./shared
COPY merchant ./merchant

CMD ["npx", "tsx", "merchant/index.ts"]
