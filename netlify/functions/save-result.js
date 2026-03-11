const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "JSON inválido",
          raw: event.body || null
        })
      };
    }

    const email = String(body.email || "").trim().toLowerCase();
    const score = Number(body.score ?? 0);
    const maxScore = Number(body.maxScore ?? 0);
    const percent = Number(body.percent ?? 0);
    const date = body.date || new Date().toISOString();
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

    if (!email) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Falta email",
          received: body
        })
      };
    }

    const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN;

    if (!siteID || !token) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Faltan NETLIFY_BLOBS_SITE_ID o NETLIFY_BLOBS_TOKEN en las variables de entorno"
        })
      };
    }

    const record = {
      id: crypto.randomUUID(),
      email,
      score,
      maxScore,
      percent,
      date,
      answers
    };

    const store = getStore("quiz-results", { siteID, token });
    const key = `result/${record.id}.json`;

    await store.setJSON(key, record);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        key
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
