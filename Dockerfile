FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY app.js ./
COPY models ./models
COPY routes ./routes
COPY views ./views
COPY public ./public

EXPOSE 3000

CMD ["node", "app.js"]
