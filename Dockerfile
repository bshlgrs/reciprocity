# Build frontend app
FROM node:16-alpine3.11
WORKDIR /app
COPY rr-app/package*.json ./
RUN npm install
COPY rr-app/. .
RUN npm run build

# Package into Python app
FROM python:3
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . . 
# Copy built npm package
COPY --from=0 /app/build /app/rr-app/build
CMD ["python3", "app.py"]  