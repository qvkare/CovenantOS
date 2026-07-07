FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY provider/package.json ./provider/
RUN npm install --workspace @covenantos/shared --workspace @covenantos/provider
COPY shared ./shared
COPY provider ./provider
RUN npm run build -w @covenantos/shared && npm run build -w @covenantos/provider

FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY provider/package.json ./provider/
RUN npm install --workspace @covenantos/shared --workspace @covenantos/provider --omit=dev
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/provider/dist ./provider/dist
EXPOSE 3002
CMD ["node", "provider/dist/server.js"]
