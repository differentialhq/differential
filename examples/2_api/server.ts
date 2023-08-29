import express from "express";
import { sayHello, sendEmail } from "./controllers";

const app = express();
const port = 3000;

app.get("/greeting", sayHello);

app.get("/email", sendEmail);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(
    `To send an email, visit http://localhost:${port}/email?to=me@example.com`
  );
});
