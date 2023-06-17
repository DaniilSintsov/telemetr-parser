# Telemetr-parser

Simple telemetr parser on Node.js using Puppeteer

## Usage

Clone the repository

```bash
git clone https://github.com/DaniilSintsov/telemetr-parser.git telemetr-parser
```

Go to the directory

```bash
cd telemetr-parser
````

Install dependencies

```bash
npm install
```

Put the link to the first page in a file `inputQueue.txt`

Create the `.env` file, put your cookie and user agent there

```dotenv
USER_AGENT=your_user_agent
COOKIE=your_cookie
```

Run parser with command

```bash
npm start
```
