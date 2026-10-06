from fastapi import FastAPI

app = FastAPI(title="Remont API")

@app.get("/health")
def health():
    return {"status": "ok"}

