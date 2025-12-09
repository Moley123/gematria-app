# Gematria Explorer

A powerful, interactive Gematria calculator and research tool built with
React. This application allows users to calculate Hebrew Gematria,
discover significant matching numbers, and search the entire Torah for
words, phrases, and verses with equivalent values.

## ✨ Features

-   **Real-time Calculation:** Instantly calculates the Gematria value
    of Hebrew text as you type.
-   **Torah Search:** Indexes the entire Torah (Pentateuch) to find
    words or phrases matching your calculated value.
    -   **Parsha Filtering:** Limit search results to specific Torah
        portions.
    -   **Whole Verse Matching:** Detects when an entire Pasuk (verse)
        sums to the target number.
    -   **Colel Mode (±1):** Optional search for values plus or minus
        one.
    -   **Single Word Mode:** Filter to show only single-word matches.
-   **Wedding / Bridge Calculator:** A unique "Matchmaker" mode that
    calculates the numerical bridge needed to connect two names to a
    target goal (e.g., *Names + X = Mazel Tov*).
-   **Common Gematria Discovery:** "Did you know?" cards that highlight
    culturally significant numbers (e.g., 18 = Chai, 26 = Hashem).
-   **Virtual Hebrew Keyboard:** Built-in on-screen keyboard for users
    without Hebrew support.
-   **Data & Stats:** Displays verse counts for Parshas and highlights
    structural matches.

## 🛠️ Tech Stack

-   **Frontend:** React.js, CSS3\
-   **Data Processing:** Python (for indexing and generating JSON
    databases)\
-   **Data Source:** Sefaria API\
-   **Deployment:** Docker, Nginx

## 🚀 Getting Started

### Prerequisites

-   **Node.js** (v14 or higher)
-   **Python 3.x** (for generating the data index)
-   **npm** or **yarn**

------------------------------------------------------------------------

### 1. Installation

Clone the repository and install dependencies:

``` bash
git clone https://github.com/your-username/gematria-explorer.git
cd gematria-explorer
npm install
```

------------------------------------------------------------------------

### 2. Generate the Data Index (Crucial Step)

The app relies on a pre-built index of the Torah. You must generate this
locally before running the app.

Navigate to the backend tools folder:

``` bash
cd backend_tools
```

Install the Python requests library:

``` bash
pip install requests
```

Run the builder scripts in order:

**Build the Torah Index:** Fetches text from Sefaria and creates the
search database.

``` bash
python build_index.py
```

Output: `public/torah_index.json` (approx. 50MB+)

**Build Parsha Map:** Fetches verse counts and ranges for all 54
Parshas.

``` bash
python build_parshas.py
```

Output: `src/utils/parshas.js`

**Build Common Dictionary:** Generates the list of common Jewish
concepts.

``` bash
python build_common_offline.py
```

Output: `src/data/common_gematria.json`

Return to the root folder:

``` bash
cd ..
```

------------------------------------------------------------------------

### 3. Run the App

Start the development server:

``` bash
npm start
```

Open: `http://localhost:3000`

------------------------------------------------------------------------

## 🐳 Deployment (Docker & Nginx)

This app is configured for production deployment using Docker and Nginx.
It is set up to run in a subdirectory (e.g.,
`yourdomain.com/gematria-explorer`).

### Configuration

-   **Homepage:** Ensure `package.json` contains

    ``` json
    "homepage": "/gematria-explorer"
    ```

-   **Proxy:** Verify your Nginx proxy passes the correct headers.

### Build and Run with Docker Compose

Make sure you have `docker-compose.yml`, `Dockerfile`, and `nginx.conf`
in your root directory.

Run the build command:

``` bash
docker-compose up -d --build
```

The app will be served on **Port 80** (or whichever port is configured).

------------------------------------------------------------------------

## 📁 Directory Structure

``` plaintext
/gematria-explorer
|-- /backend_tools        # Python scripts to generate data
|-- /public               # Static assets & Large DB (torah_index.json)
|-- /src
|   |-- /data             # Smaller JSON data (common_gematria.json)
|   |-- /utils            # Logic (calculator, filter, keyboard)
|   |-- App.js            # Main Component
|   |-- App.css           # Styling
|-- Dockerfile            # Production build instructions
|-- nginx.conf            # Nginx server config
|-- package.json
```

------------------------------------------------------------------------

## 🤝 Acknowledgements

-   **Sefaria:** For providing an incredible open API for Jewish texts.\
-   **Open Source:** Built with React and Python.

------------------------------------------------------------------------

## 📄 License

This project is licensed under the **MIT License**.
