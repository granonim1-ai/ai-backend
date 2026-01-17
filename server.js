import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

// Бесплатная, стабильная модель
const HF_MODEL_URL =
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

function buildPrompt(mode, text) {
  if (mode === "view") {
    return `
Ты нейтральный аналитик.
Не давай советов, не оценивай, не мотивируй.

Структурируй ответ:
1. Факты ситуации
2. Интерпретации
3. Ключевая точка напряжения
4. Что пока не определено

Текст:
${text}
`;
  } else {
    return `
Ты помогаешь подготовиться к разговору.
Без манипуляций и оценок.

Дай:
1. Цель разговора
2. Структуру разговора
3. Чего избегать
4. Возможные реакции

Текст:
${text}
`;
  }
}

app.post("/analyze", async (req, res) => {
  const { text, mode } = req.body;

  try {
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: buildPrompt(mode, text),
        parameters: {
          max_new_tokens: 400,
          temperature: 0.3
        }
      })
    });

    const data = await response.json();

    // HF иногда возвращает массив
    if (Array.isArray(data) && data[0]?.generated_text) {
      return res.json({ result: data[0].generated_text });
    }

    // Иногда объект
    if (data.generated_text) {
      return res.json({ result: data.generated_text });
    }

    return res.status(500).json({
      error: "HF unexpected response",
      details: data
    });

  } catch (e) {
    return res.status(500).json({
      error: "HF server error",
      details: e.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend работает (Hugging Face)");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
