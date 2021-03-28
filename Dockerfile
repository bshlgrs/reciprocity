# Build frontend app
FROM node:14-alpine
WORKDIR /app
COPY reciprocity_frontend/package*.json ./
RUN npm install
COPY reciprocity_frontend/. .
RUN npm run build

# Package into Python app
FROM python:3
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . . 
# Copy built npm package
COPY --from=0 /app/build /app/reciprocity_frontend/build
CMD ["python3", "app.py"]  