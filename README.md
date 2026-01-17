@ -0,0 +1,62 @@
# Workout Tracker

Современное full-stack приложение для ведения тренировочного дневника с персональными AI-рекомендациями по прогрессии нагрузки.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Основные возможности

- Планирование и ведение тренировок с drag-and-drop
- Автоматический расчёт тренировочного объёма и интенсивности
- AI-рекомендации по прогрессии весов и повторений на основе **RIR** (Reps in Reserve)
- Аналитика прогресса: объём, распределение по мышечным группам, силовые показатели
- Адаптивный интерфейс (Tailwind + Headless UI)
- Полная аутентификация (JWT)
- Миграции базы данных через Alembic
- Мониторинг через Prometheus + Grafana (опционально)

## Технологический стек

**Backend**  
- Python 3.11 + FastAPI  
- SQLAlchemy 2.0 + Alembic  
- PostgreSQL  
- Redis (опционально — кэш/очереди)  
- Pydantic v2  
- JWT-аутентификация  
- Prometheus metrics

**Frontend**  
- React 18 + Vite  
- TypeScript  
- Tailwind CSS  
- Lucide Icons  
- React Router v6  
- Axios + Context API  
- @dnd-kit (drag & drop)

**Инфраструктура**  
- Docker + docker-compose  
- Мониторинг (Prometheus + Grafana)

## Быстрый старт (локальная разработка)

```bash
# Клонируем репозиторий
git clone https://github.com/ваш-username/workout-tracker.git
cd workout-tracker

# Запускаем всё одной командой (backend + frontend + postgres + redis)
docker compose up -d --build

# Миграции (если нужно выполнить вручную)
docker compose exec backend alembic upgrade head

# Открываем браузер
Frontend → http://localhost:5173
Backend docs → http://localhost:8000/docs
