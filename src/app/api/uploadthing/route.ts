import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// ✅ v6+ correct syntax
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
