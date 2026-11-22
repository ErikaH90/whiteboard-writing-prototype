import serverless from "serverless-http";
import { createApiApp } from "../../server/api.mjs";

const functionPath = "/.netlify/functions/api";

// The same Express app as the local server. Keys are read from Netlify's environment variables.
const run = serverless(createApiApp(), { binary: ["audio/*"] });

export async function handler(event, context) {
  // Requests arrive through the /api/* rewrite; a direct call to the function gets the same routes.
  const path = event.path?.startsWith(functionPath)
    ? `/api${event.path.slice(functionPath.length)}`
    : event.path;
  return run({ ...event, path }, context);
}
