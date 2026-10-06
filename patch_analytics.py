with open('backend/app/main.py', 'r') as f:
    content = f.read()

if 'analytics_router' not in content:
    content = content.replace(
        'plans_router, templates_router',
        'plans_router, templates_router, analytics_router'
    )
    content += '\napp.include_router(analytics_router.router, prefix="/api/v1/analytics", tags=["analytics"])'
    
    with open('backend/app/main.py', 'w') as f:
        f.write(content)
