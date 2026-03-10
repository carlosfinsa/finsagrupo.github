const { getStore } = require("@netlify/blobs");
const crypto = require("node:crypto");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { email, score, maxScore, percent, date, answers } = body;

    if (!email || typeof score !== "number" || !answers || typeof answers !== "object") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Datos incompletos" })
      };
    }

    const safeEmail = String(email).trim().toLowerCase();

    const record = {
      id: crypto.randomUUID(),
      email: safeEmail,
      score,
      maxScore,
      percent,
      date: date || new Date().toISOString(),
      answers
    };

    const store = getStore("quiz-results");
    const key = `result-${record.date}-${record.id}.json`;

    await store.setJSON(key, record);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ok: true,
        id: record.id
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Error interno",
        detail: error.message
      })
    };
  }
};
};
