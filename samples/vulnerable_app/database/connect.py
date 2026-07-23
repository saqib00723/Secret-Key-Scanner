import psycopg2

# Database configuration with hardcoded production connection string
DB_URL = "postgresql://admin:SecretPass123!@db.production.internal.net:5432/finance_db"
JWT_SECRET = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

def get_connection():
    return psycopg2.connect(DB_URL)
