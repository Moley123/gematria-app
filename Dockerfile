# Stage 1: Build the React App
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the build output to Nginx's html folder
COPY --from=build /app/build /usr/share/nginx/html
# Copy a custom nginx config (we will create this in the next step)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]