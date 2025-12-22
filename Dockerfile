# Stage 1: Build the React App
FROM node:18-alpine as build
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy source code (Ensure public folder is included!)
COPY . .

# 3. DEBUG: List files to prove 'public' exists before build
RUN ls -la public

# 4. Build the app
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# 5. DEBUG: List the final build folder to prove index.html exists
RUN ls -la build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]