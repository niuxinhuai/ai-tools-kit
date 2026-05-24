# Security Notes

AI Tools Kit is designed for local or self-hosted use.

## API Keys

- API keys should be stored in `.env` or server environment variables.
- The web UI does not need to store API keys in browser local storage.
- `/api/health` reports whether a key is configured, but never returns the key value.
- Avoid passing `provider.apiKey` from browser code in shared or hosted deployments.

## Hosting

If you deploy the app publicly, put it behind authentication or deploy it only for trusted users. The API endpoints can call your configured AI provider, so an open deployment can spend your quota.

## Local Data

Browser history is stored in local storage on the user's machine. It is not sent anywhere except when the user reruns or exports a result.
