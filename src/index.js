import express from "express";
import usersRoutes from "./routes/index.routes.js";
import morgan from "morgan";
import { PORT } from "./config.js";

const app = express();

app.use(morgan("dev"));

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", usersRoutes);

app.listen(PORT);
// eslint-disable-next-line no-console
console.log("Server on port", PORT);
// Exportar la aplicación para poder usarla en otras partes (como en las pruebas)

export default app;
