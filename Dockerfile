FROM node:16-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install @vue/cli

COPY . .
ENV VITE_PROD_SERVER=false
EXPOSE 8080
CMD ["npm", "run", "serve"]
