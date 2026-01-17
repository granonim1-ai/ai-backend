import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

function systemPrompt(mode) {
  if (mode === "view") {
    return `
Ты нейтральный аналитик.
Не давай советов, не оценивай, не мотивируй.

Структурируй ответ строго:
1. Факты ситуации
2. Интерпретации и допущения
3. Ключевая точка напряжения
4. Что пока не определено

Кратко, спокойно, без морали.
`;
  } else {
    return `
Ты помогаешь подготовиться к разговору.
Не манипулируй и не оценивай.

Дай:
1. Нейтральную цель разговора
2. Структуру разговора
3. Чего лучше избегать
4. Возможные реакции собеседника

Кратко и по делу.
`;
  }
}

app.post("/analyze", async (req, res) => {
  const { text, mode } = req.body;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt(mode) },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices) {
      return res.status(500).json({ error: "DeepSeek API error", details: data });
    }

    res.json({ result: data.choices[0].message.content });

  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend работает (DeepSeek)");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
