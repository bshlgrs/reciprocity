# Reciprocity

## Running locally

Create a database with Postgres; copy-paste `create_db.sql` into it to set up the tables you need.

Run the backend with
`DB_URL={whatever} python3 app.py`

And run the frontend with `npm run start`

And run `ngrok http -bind-tls=true -host-header="localhost:3000" localhost:3000` to tunnel the client through a HTTPS server (required to work with the FB API).

