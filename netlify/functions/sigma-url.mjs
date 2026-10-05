import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export default async function handler() {
  try {
    const required = [
      "SIGMA_BASE_URL",
      "SIGMA_CLIENT_ID",
      "SIGMA_EMBED_SECRET",
      "SIGMA_EMAIL"
    ];

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const clientId = process.env.SIGMA_CLIENT_ID;

    const claims = {
      sub: process.env.SIGMA_EMAIL,
      iss: clientId,
      jti: randomUUID(),
      iat: now,
      exp: now + 3600
    };

    if (process.env.SIGMA_TEAM) {
      claims.teams = [process.env.SIGMA_TEAM];
    }

    if (process.env.SIGMA_ACCOUNT_TYPE) {
      claims.account_type = process.env.SIGMA_ACCOUNT_TYPE;
    }

    const token = jwt.sign(
      claims,
      process.env.SIGMA_EMBED_SECRET,
      {
        algorithm: "HS256",
        header: { kid: clientId }
      }
    );

    const baseUrl = process.env.SIGMA_BASE_URL;
    const separator = baseUrl.includes("?") ? "&" : "?";

    const embedUrl =
      `${baseUrl}${separator}:jwt=${encodeURIComponent(token)}&:embed=true`;

    return new Response(JSON.stringify({ url: embedUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
