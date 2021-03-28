# Reciprocity

## Running locally

Create a database with Postgres; copy-paste `create_db.sql` into it to set up the tables you need.

Run the backend with
`DB_URL={whatever} python3 app.py`

And run the frontend with `npm run start`

And run `ngrok http -bind-tls=true -host-header="localhost:3000" localhost:3000` to tunnel the client through a HTTPS server (required to work with the FB API).

## Deploying to heroku

- Install heroku and log into an account that can access the heroku app on the heroku CLI
- Run `git remote add heroku https://git.heroku.com/reciprocity2.git/` to set up the Heroku remote for the first time.
- Do `git push heroku main` to deploy. It builds from the Dockerfile.