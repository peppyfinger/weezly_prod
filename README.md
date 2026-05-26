# WEEZLY — Интеллектуальная платформа электронной коммерции

**WEEZLY** — это полнофункциональная e-commerce платформа с ИИ-ассистентом, системой умных гарантий, трекером цен, платежным шлюзом bePaid и реальной отправкой email-уведомлений.

---

## Быстрый старт

### Предварительные требования

- **Node.js** >= 18.x — [Скачать](https://nodejs.org)
- **npm** >= 9.x (входит в состав Node.js)

### Установка и запуск

```bash
# 1. Клонировать репозиторий (если применимо)
git clone https://github.com/your-org/weezly.git
cd weezly

# 2. Установить зависимости фронтенда
npm install

# 3. Установить зависимости бэкенда
cd server && npm install && cd ..

# 4. Запустить сервер разработки (фронтенд)
npm run dev

# 5. В другом терминале запустить бэкенд
cd server && npm run dev
```

Фронтенд: **http://localhost:5173**
Бэкенд API: **http://localhost:3001**

### Другие команды

```bash
# Сборка для продакшн (фронтенд)
npm run build

# Сборка бэкенда
cd server && npm run build

# Проверка TypeScript
npm run typecheck
```

---

## Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

### Основные переменные

| Переменная | Описание |
|-----------|----------|
| `PORT` | Порт бэкенд-сервера (по умолчанию 3001) |
| `FRONTEND_URL` | URL фронтенда для CORS |

---

## Настройка SMTP для отправки email

WEEZLY отправляет реальные письма через SMTP. Для работы нужно настроить «Пароль приложения».

### Пошаговая инструкция для Gmail

1. **Войдите в аккаунт Google**
   - Перейдите на [myaccount.google.com](https://myaccount.google.com)

2. **Включите двухфакторную аутентификацию**
   - Раздел «Безопасность» → «Двухэтапная аутентификация»
   - Следуйте инструкциям для включения 2FA

3. **Создайте пароль приложения**
   - Раздел «Безопасность» → «Пароли приложений» (появится после включения 2FA)
   - Нажмите «Создать новый пароль приложения»
   - Назовите его, например: «WEEZLY Platform»
   - Google покажет 16-значный код вида: `xxxx xxxx xxxx xxxx`

4. **Добавьте пароль в .env**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   SMTP_FROM=WEEZLY Platform <noreply@weezly.com>
   ```

### Для Яндекс Почты

1. Войдите в [passport.yandex.ru](https://passport.yandex.ru)
2. Включите двухфакторную аутентификацию
3. Создайте пароль приложения: «Безопасность» → «Пароли приложений»
4. Настройки SMTP для Яндекса:
   ```
   SMTP_HOST=smtp.yandex.ru
   SMTP_PORT=587
   SMTP_USER=your-email@yandex.ru
   SMTP_PASS=your-app-password
   ```

### Для Mail.ru

```
SMTP_HOST=smtp.mail.ru
SMTP_PORT=587
SMTP_USER=your-email@mail.ru
SMTP_PASS=your-app-password
```

### Когда письма отправляются?

1. **Снижение цены** — когда цена товара достигает целевого уровня, заданного пользователем
2. **Подтверждение заказа** — после успешной оплаты отправляется чек с деталями
3. **Восстановление пароля** — при нажатии «Забыли пароль» отправляется код подтверждения

---

## Настройка платежной системы Stripe

Stripe — международная платежная система для приема карт Visa, Mastercard и других.

### Получение тестовых ключей

1. **Зарегистрируйтесь в Stripe**
   - Перейдите на [dashboard.stripe.com](https://dashboard.stripe.com/register)
   - Создайте бесплатный аккаунт

2. **Получите API ключи**
   - В дашборде перейдите в **Developers** → **API Keys**
   - Скопируйте:
     - **Publishable key** (начинается с `pk_test_`)
     - **Secret key** (начинается с `sk_test_`)

3. **Добавьте в .env**
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

### Тестовые карты Stripe

| Номер карты | Результат |
|-------------|-----------|
| `4242 4242 4242 4242` | Успешная оплата |
| `4000 0025 0000 3155` | Требует 3D Secure |
| `4000 0000 0000 0002` | Отклонено (decline) |
| `4000 0000 0000 9995` | Недостаточно средств |

**CVC:** любой 3-значный код
**Срок:** любая дата в будущем
**Почта:** любой email

### Валюты и конвертация

Stripe работает с множеством валют, но не поддерживает BYN.
- Система автоматически конвертирует BYN в USD по курсу ~0.31
- USD принимается напрямую без конвертации

### Как работает оплата

1. Пользователь выбирает товары и переходит к оплате
2. Бэкенд создает PaymentIntent через Stripe API
3. Фронтенд показывает форму карты (Stripe Elements)
4. После успешной оплаты Stripe отправляет webhook (опционально)
5. Заказ переводится в статус «Оплачен»

### Настройка Webhooks (опционально)

Для production рекомендуем настроить webhooks:

1. В Stripe Dashboard → **Developers** → **Webhooks**
2. Нажмите **Add endpoint**
3. URL: `https://your-domain.com/api/payments/webhook`
4. Выберите события: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Скопируйте **Signing secret** и добавьте в `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## Учетные данные администратора

| Поле | Значение |
|------|---------|
| Логин | `admin` |
| Пароль | `admin123` |

---

## Архитектура проекта

```
weezly/
├── src/                    # Фронтенд (React + Vite)
│   ├── api/               # API клиент для бэкенда
│   ├── components/        # React компоненты
│   ├── context/           # Глобальное состояние (Context API)
│   └── data/              # Статические данные
│
├── server/                 # Бэкенд (Node.js + Express)
│   ├── src/
│   │   └── index.ts       # Основной серверный файл
│   ├── package.json
│   └── tsconfig.json
│
├── .env                    # Переменные окружения
├── .env.example            # Пример конфигурации
└── README.md               # Этот файл
```

---

## API Endpoints

### Уведомления

```
POST /api/notifications/send
Body: {
  to: string,          // Email получателя
  type: 'priceDrop' | 'orderConfirmation' | 'passwordReset',
  language: 'ru' | 'be' | 'en',
  data: object        // Данные для шаблона
}
```

### Платежи

```
POST /api/payments/create-intent
Body: {
  amount: number,      // Сумма
  currency: 'BYN' | 'USD',
  orderId: string,     // ID заказа
  customerEmail: string,
  description: string,
  language: 'ru' | 'be' | 'en'
}
Response: {
  success: boolean,
  clientSecret: string,  // Для Stripe.js
  paymentIntentId: string,
  amount: number,        // Сумма в центах USD
  currency: 'usd'
}

GET /api/payments/status/:paymentIntentId
Response: { success, status, paymentIntentId, amount, currency }

POST /api/payments/webhook
Прием уведомлений от Stripe о статусе оплаты
```

### Авторизация

```
POST /api/auth/forgot-password
Body: { email: string, language: 'ru' | 'be' | 'en' }
Response: { success, code }
```

---

## Функциональность

### ИИ-ассистент
- Обработка запросов на русском, беларуском и английском
- Извлечение категории, бюджета и тегов
- «Мягкий откат» при отсутствии точных совпадений

### Система отзывов
- Рейтинг 1-5 звезд
- Мгновенный пересчет среднего рейтинга
- Динамическое обновление смарт-балла

### Трекер цен
- Установка целевой цены
- Автоматические уведомления о снижении
- Push-уведомления + email

### Умная гарантия
- Динамический расчёт на основе MTBF
- 4 уровня защиты

### Локализация
- Русский / Беларуская / English
- BYN / USD автоматическая конвертация

### Платежи
- Интеграция с Stripe
- Поддержка карт Visa/Mastercard
- Автоматическая конвертация BYN → USD
- Автоматические чеки на email

---

## Безопасность

- SMTP credentials хранятся только в `.env`
- Stripe Secret Key используется только на сервере
- Publishable Key безопасен для использования на фронтенде
- CORS настроен для фронтенда
- Webhook signature verification для production

---

## Поддержка

При возникновении проблем:
1. Проверьте `.env` файл
2. Убедитесь, что бэкенд запущен (`cd server && npm run dev`)
3. Проверьте консоль браузера на ошибки

---

*WEEZLY Platform — Production-Ready E-Commerce, 2024*
