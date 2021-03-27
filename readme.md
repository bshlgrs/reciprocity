# Reciprocity

## Running locally

Because we're brave people, we develop against the production DB.

Run the backend with
`DB_URL={the secret DB URL} python3 app.py`

And run the frontend with `npm run start`

And run `ngrok http -bind-tls=true -host-header="localhost:3000" localhost:3000` to tunnel the client through a HTTPS server (required to work with the FB API).

