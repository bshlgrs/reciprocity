# Build frontend app
FROM node:16-alpine3.11
WORKDIR /app
COPY reciprocity_frontend/package*.json ./
RUN npm install
COPY reciprocity_frontend/. .
RUN npm run build

# Package into Python app
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . . 
# Copy built npm package
COPY --from=0 /app/build /app/reciprocity_frontend/build
# Serve with gunicorn (production WSGI server). Shell form so $PORT expands;
# defaults to 5001 for local `docker run` where Heroku's $PORT isn't set.
# Heroku's heroku.yml `run.web` overrides this CMD in production.
CMD gunicorn app:app --bind 0.0.0.0:${PORT:-5001} --workers 2 --threads 4 --timeout 120
