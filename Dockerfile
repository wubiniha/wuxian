FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 11081
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "11081"]
