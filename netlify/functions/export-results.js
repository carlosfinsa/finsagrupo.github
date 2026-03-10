const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  try {
    const store = getStore("quiz-results");
    const { blobs } = await store.list();

    const results = [];

    for (const blob of blobs) {
      const item = await store.get(blob.key, { type: "json" });
      if (item) {
        results.push(item);
      }
    }

    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Error exportando resultados",
        detail: error.message
      })
    };
  }
};
