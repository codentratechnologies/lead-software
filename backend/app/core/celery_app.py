from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.task_routes = {
    "app.workers.lead_tasks.*": "main-queue"
}

# Run tasks synchronously for local MVP development (bypasses Redis)
celery_app.conf.task_always_eager = True
