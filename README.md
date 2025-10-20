# 10xCards

[![Project Status: Active](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)

An AI-powered web application designed to revolutionize the creation of educational flashcards for computer science students.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10xCards solves the problem of time-consuming manual flashcard creation. By leveraging AI, the application automates the generation of flashcards from text notes, allowing students to focus on learning rather than preparation. Users can generate, manage, and edit flashcard decks, and study them using an integrated spaced repetition algorithm. This project is being developed as a hobby to provide a simple yet effective learning tool.

## Tech Stack

The project is built with a modern tech stack:

| Category              | Technology                                                     |
| --------------------- | -------------------------------------------------------------- |
| **Frontend**          | Astro 5, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui     |
| **Backend & Database**| Supabase                                                       |
| **AI Integration**    | OpenRouter.ai                                                  |
| **CI/CD & Hosting**   | GitHub Actions, DigitalOcean                                   |

## Getting Started Locally

To run the project locally, follow these steps:

### Prerequisites

- Node.js `22.14.0` (it is recommended to use `nvm` - `nvm use`)
- npm (or your preferred package manager)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/10x-cards.git
    cd 10x-cards
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables. You can copy the example file:
    ```bash
    cp .env.example .env
    ```
    You will need to provide your own credentials for services like Supabase and OpenRouter.
    ```env
    # Supabase
    PUBLIC_SUPABASE_URL=your_supabase_url
    PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

    # OpenRouter.ai
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

This project includes the following scripts defined in `package.json`:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Lints the codebase for errors.
- `npm run lint:fix`: Lints and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### In Scope (MVP)

-   **User Accounts**: Registration and login to manage flashcard decks.
-   **AI Flashcard Generation**: Generate flashcards from text (up to 10,000 characters).
-   **Manual Creation**: Manually add, edit, and delete flashcards.
-   **Deck Management**: A dashboard to view, edit, and delete decks.
-   **Spaced Repetition**: Integration with an open-source library for spaced repetition.
-   **Learning Interface**: A simple interface for study sessions.

### Out of Scope

-   Advanced, proprietary repetition algorithms (e.g., SuperMemo/Anki style).
-   Importing files in various formats (PDF, DOCX).
-   Sharing and publishing flashcard decks.
-   Integrations with external educational platforms.
-   Dedicated mobile applications.
-   Monetization and commercial features.

## Project Status

This is a hobby project and is currently under **active development**. New features and improvements are being added continuously.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
