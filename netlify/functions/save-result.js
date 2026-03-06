exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Método no permitido" })
      };
    }

    const { email, score, maxScore, percent, date } = JSON.parse(event.body || "{}");

    if (!email || typeof score !== "number") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Datos incompletos" })
      };
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const token = process.env.GITHUB_TOKEN;
    const path = "resultados.csv";

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    };

    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    let currentCsv = "email,score,maxScore,percent,date\n";
    let sha = null;

    const getResp = await fetch(getUrl, { headers });

    if (getResp.ok) {
      const fileData = await getResp.json();
      sha = fileData.sha;
      currentCsv = Buffer.from(fileData.content, "base64").toString("utf8");
    } else if (getResp.status !== 404) {
      const errText = await getResp.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error leyendo CSV", detail: errText })
      };
    }

    const safeEmail = String(email).replace(/,/g, " ").trim();
    const newLine = `${safeEmail},${score},${maxScore},${percent},${date}\n`;
    const updatedCsv = currentCsv + newLine;

    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const payload = {
      message: `Añadir resultado de ${safeEmail}`,
      content: Buffer.from(updatedCsv, "utf8").toString("base64"),
      branch
    };

    if (sha) {
      payload.sha = sha;
    }

    const putResp = await fetch(putUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload)
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error guardando CSV", detail: errText })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno", detail: error.message })
    };
  }
};
