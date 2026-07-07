FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY mock-provider/package.json ./mock-provider/
RUN npm install --workspace @covenantos/shared --workspace @covenantos/mock-provider

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @covenantos/shared && npm run build -w @covenantos/mock-provider

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/mock-provider ./mock-provider
EXPOSE 3002
CMD ["node", "mock-provider/dist/server.js"]
