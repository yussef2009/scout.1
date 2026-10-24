import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://scout:scoutpass@localhost:5432/scoutai_db")
SQLITE_FALLBACK = os.getenv("SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")

engine = None
SessionLocal = None
Base = declarative_base()

try:
    if not SQLITE_FALLBACK and DATABASE_URL.startswith("postgresql"):
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            pass
    else:
        # SQLite local fallback
        sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scoutai_dev.db"))
        sqlite_url = f"sqlite:///{sqlite_path}"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        print(f"[Database] Using local SQLite database at: {sqlite_url}")
except Exception as e:
    print(f"[Database Warning] PostgreSQL connection failed ({e}). Falling back to SQLite.")
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scoutai_dev.db"))
    sqlite_url = f"sqlite:///{sqlite_path}"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
