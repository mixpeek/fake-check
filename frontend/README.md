# FakeCheck Frontend

This is the React/TypeScript frontend for the FakeCheck AI-powered deepfake detection platform. It provides a user-friendly interface for uploading videos, monitoring analysis progress, and viewing detailed detection reports.

## Features

-   **Modern UI:** Built with React, TypeScript, and styled with Tailwind CSS.
-   **File Upload:** A simple drag-and-drop interface for uploading video files.
-   **Real-time Progress:** Shows the status of the video analysis, from uploading to processing.
-   **Detailed Results:** Displays a comprehensive report including an overall authenticity score, confidence levels, and a breakdown of individual heuristic checks (e.g., lip-sync, eye movement, visual artifacts).
-   **Interactive Video Player:** Allows users to seek to specific timestamps where anomalies were detected.
-   **Responsive Design:** Works on both desktop and mobile devices.

---

## Running Locally

Follow these instructions to set up and run the frontend on your local machine for development.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A running instance of the [FakeCheck backend API](https://github.com/your-repo/fakecheck/tree/main/backend) on `localhost:8000`.

### Setup Steps

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    The frontend needs to know where to find the backend API. For local development, it defaults to `http://localhost:8000/api`. If your backend is running elsewhere, create a `.env.local` file:
    ```
    # frontend/.env.local
    VITE_API_BASE_URL=http://localhost:8000/api
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

5.  **Open the application:**
    Open your browser and navigate to `http://localhost:5173` (or the address provided by Vite).

---
