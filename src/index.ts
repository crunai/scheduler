import { app } from "./app";
import { connectMongoose } from "./database";

const port = process.env.PORT || 3000;
connectMongoose();

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
