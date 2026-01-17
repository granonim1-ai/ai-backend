import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt(mode) },
            { role: "user", content: text }
          ]
        })
      }
    );

    const data = await response.json();
    res.json({ result: data.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ error: "AI error" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend работает");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
