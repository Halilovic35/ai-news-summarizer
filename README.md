# AI News Summarizer

A web application that uses AI to generate concise summaries of news articles.

## Features

- Input any news article URL
- Get AI-generated summaries using OpenAI's GPT-3.5
- Modern, responsive UI with Tailwind CSS
- Real-time feedback and error handling

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-news-summarizer
```

2. Setup Frontend:
```bash
cd client
npm install
```

3. Setup Backend:
```bash
cd ../server
npm install
```

4. Configure Environment Variables:
- Create a `.env` file in the server directory
- Add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Enter a news article URL in the input field
2. Click "Generate Summary"
3. Wait for the AI to process the article
4. View the generated summary

## Technologies Used

- Frontend:
  - React
  - Vite
  - Tailwind CSS
  - Axios
  - Framer Motion
- Backend:
  - Node.js
  - Express
  - OpenAI API
  - CORS
  - dotenv 