FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY web/package.json ./web/
RUN npm install --workspace=@covenantos/shared --workspace=@covenantos/web

FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_MSW=false
ARG NEXT_PUBLIC_CSPRCLICK_APP_ID=csprclick-template
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MSW=$NEXT_PUBLIC_MSW
ENV NEXT_PUBLIC_CSPRCLICK_APP_ID=$NEXT_PUBLIC_CSPRCLICK_APP_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @covenantos/shared
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @covenantos/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/public ./web/public
EXPOSE 3000
CMD ["node", "web/server.js"]
