import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    SERVER_HOST = os.getenv('SERVER_HOST', '')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 8080))
    DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1')