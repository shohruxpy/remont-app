from fastapi import FastAPI
from .routers import auth_router, machines_router, users_router, materials_router, repairs_router, zaprafka_router, plans_router, templates_router, analytics_router
from .database import engine, Base
import contextlib
from fastapi.middleware.cors import CORSMiddleware

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Remont API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(machines_router.router, prefix="/api/v1/machines", tags=["machines"])
app.include_router(users_router.router, prefix="/api/v1/users", tags=["users"])
app.include_router(materials_router.router, prefix="/api/v1/materials", tags=["materials"])
app.include_router(repairs_router.router, prefix="/api/v1/repairs", tags=["repairs"])
app.include_router(zaprafka_router.router, prefix="/api/v1/zaprafka", tags=["zaprafka"])

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(plans_router.router, prefix="/api/v1/plans", tags=["plans"])
app.include_router(templates_router.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(analytics_router.router, prefix="/api/v1/analytics", tags=["analytics"])

from .routers import audit_router, reports_router
app.include_router(audit_router.router, prefix="/api/v1/audit-log", tags=["audit"])
app.include_router(reports_router.router, prefix="/api/v1/reports", tags=["reports"])
@app.get('/api/v1/health')
def api_health():
    return {'status': 'ok'}
