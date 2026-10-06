with open('backend/app/main.py', 'r') as f:
    content = f.read()

if 'templates_router' not in content:
    content = content.replace(
        'from .routers import auth_router, machines_router, users_router, materials_router, repairs_router, zaprafka_router',
        'from .routers import auth_router, machines_router, users_router, materials_router, repairs_router, zaprafka_router, plans_router, templates_router'
    )
    content += '\napp.include_router(plans_router.router, prefix="/api/v1/plans", tags=["plans"])'
    content += '\napp.include_router(templates_router.router, prefix="/api/v1/templates", tags=["templates"])'
    
    with open('backend/app/main.py', 'w') as f:
        f.write(content)
