// Netlify Function для безопасной работы с Groq API
// API ключ хранится в переменных окружения Netlify и недоступен в браузере

exports.handler = async (event, context) => {
  // Разрешаем только POST запросы
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Получаем данные от клиента
    const { bookTitle, userContext } = JSON.parse(event.body);

    // Валидация
    if (!bookTitle || !userContext) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'bookTitle и userContext обязательны' })
      };
    }

    // API ключ из переменных окружения (безопасно!)
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY не найден в переменных окружения');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Ошибка конфигурации сервера' })
      };
    }

    // Формируем промпт
    const prompt = `Ты эксперт по превращению книжных знаний в конкретные действия. Твоя задача - трансформировать идеи из книги в немедленные, практические шаги.

ЗАДАЧА:
- Книга: "${bookTitle}"
- Контекст пользователя: "${userContext}"

ПРОЦЕСС:
1. Определи книгу и автора
2. Извлеки 5 ГЛАВНЫХ ИДЕЙ из книги (самые важные концепции)
3. Создай 3-5 КОНКРЕТНЫХ ДЕЙСТВИЙ, персонализированных под контекст пользователя
   - Каждое действие должно быть простым, выполнимым и специфичным
   - Укажи ЗАЧЕМ это действие важно (ссылаясь на идеи из книги)
   - Сделай действия последовательными - от простого к сложному

ФОРМАТ ВЫВОДА (СТРОГО):

[Название книги] - [Автор]

━━━━━━━━━━━━━━━━━━━━━━━

ГЛАВНЫЕ ИДЕИ КНИГИ:

1. [Первая ключевая идея из книги - 1-2 предложения]

2. [Вторая ключевая идея из книги - 1-2 предложения]

3. [Третья ключевая идея из книги - 1-2 предложения]

4. [Четвертая ключевая идея из книги - 1-2 предложения]

5. [Пятая ключевая идея из книги - 1-2 предложения]

━━━━━━━━━━━━━━━━━━━━━━━

КОНКРЕТНЫЕ ДЕЙСТВИЯ:

Действие 1:
[Конкретное, специфичное действие]
Зачем: [Объяснение со ссылкой на идеи книги]

Действие 2:
[Конкретное, специфичное действие]
Зачем: [Объяснение со ссылкой на идеи книги]

Действие 3:
[Конкретное, специфичное действие]
Зачем: [Объяснение со ссылкой на идеи книги]

Действие 4:
[Конкретное, специфичное действие]
Зачем: [Объяснение со ссылкой на идеи книги]

Действие 5:
[Конкретное, специфичное действие]
Зачем: [Объяснение со ссылкой на идеи книги]

ПРАВИЛА:
- Будь МАКСИМАЛЬНО КОНКРЕТНЫМ в действиях (не "займись спортом", а "завтра в 7 утра сделай 10 отжиманий")
- Каждое действие должно быть выполнимо за 5-30 минут
- Действия должны быть персонализированы под контекст: "${userContext}"
- Расставь действия по сложности: от самого простого к более сложному
- Используй простой, понятный язык
- Пиши на русском языке
- СТРОГО следуй формату выше
- Общий ответ должен быть 300-500 слов`;

    // Запрос к Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: errorData.error?.message || 'Ошибка при обращении к Groq API' 
        })
      };
    }

    const data = await response.json();
    const plan = data.choices[0].message.content;

    // Возвращаем результат клиенту
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Внутренняя ошибка сервера',
        details: error.message 
      })
    };
  }
};
