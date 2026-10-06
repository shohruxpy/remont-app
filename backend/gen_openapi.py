import yaml
from fastapi.openapi.utils import get_openapi
from app.main import app
import sys

def main():
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    with open("../docs/openapi.yaml", "w", encoding="utf-8") as f:
        yaml.dump(openapi_schema, f, sort_keys=False, allow_unicode=True)
    print("openapi.yaml generated successfully.")

if __name__ == "__main__":
    main()
