import { app } from "./app";
import { log } from "./logger";

app.listen(3000);

log.info(
  { url: { full: `http://${app.server?.hostname}:${app.server?.port}` } },
  "UUIDaaS is running",
);
