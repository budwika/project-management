import App from "./app";

const PORT = parseInt(process.env.PORT || "3001", 10);

// Create and start the application
const app = new App();
app.start(PORT);
