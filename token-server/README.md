# Agora Token Server

## Setup

1.  Open `.env` file and set your `APP_CERTIFICATE` from Agora Console.
    `APP_ID` is already pre-filled.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    The server runs on port 8080 by default.

## Deployment

To deploy to Render/Railway:
1.  Push this folder (or the whole repo and specify this root).
2.  Set Environment Variables (`APP_ID`, `APP_CERTIFICATE`) in the cloud dashboard.
3.  Update the Frontend `VITE_AGORA_TOKEN_SERVER` to point to the deployed URL (e.g., `https://my-agora-server.render.com`).
