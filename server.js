import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
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
        messages: [
          { role: "system", content: systemPrompt(mode) },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();

    // 🔍 ЛОГИРУЕМ ВСЁ, ЧТО ПРИШЛО ОТ DEEPSEEK
    console.log("DeepSeek response:", JSON.stringify(data));

    if (data.choices && data.choices[0]?.message?.content) {
      return res.json({ result: data.choices[0].message.content });
    }

    // 🔴 Если формат неожиданный — вернём его целиком
    return res.status(500).json({
      error: "Unexpected DeepSeek response",
      details: data
    });

  } catch (e) {
    return res.status(500).json({
      error: "Server exception",
      details: e.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend работает");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
