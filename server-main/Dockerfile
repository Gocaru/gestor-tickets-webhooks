FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/database

EXPOSE 3000

CMD ["node", "src/app.js"]