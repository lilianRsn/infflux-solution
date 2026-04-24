FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY shared ./shared
COPY merchant ./merchant
COPY fleet ./fleet

CMD ["npx", "tsx", "merchant/index.ts"]
