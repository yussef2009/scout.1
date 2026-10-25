import os
from sqlalchemy import create_engine, inspect, text
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


def run_migrations():
    """
    Automatic non-destructive schema migration for SQLite / PostgreSQL.
    Adds subscription & billing columns if upgrading existing local databases.
    """
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        if "organizations" in existing_tables:
            org_columns = {col["name"] for col in inspector.get_columns("organizations")}
            new_org_cols = [
                ("subscription_tier", "VARCHAR(50) DEFAULT 'PRO'"),
                ("subscription_status", "VARCHAR(50) DEFAULT 'ACTIVE'"),
                ("billing_cycle", "VARCHAR(20) DEFAULT 'monthly'"),
                ("currency", "VARCHAR(10) DEFAULT 'EGP'"),
                ("stripe_customer_id", "VARCHAR(100)"),
                ("stripe_subscription_id", "VARCHAR(100)"),
                ("paymob_customer_id", "VARCHAR(100)"),
                ("paymob_order_id", "VARCHAR(100)"),
                ("current_period_start", "DATETIME"),
                ("current_period_end", "DATETIME"),
            ]
            with engine.connect() as conn:
                for col_name, col_type in new_org_cols:
                    if col_name not in org_columns:
                        try:
                            conn.execute(text(f"ALTER TABLE organizations ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception:
                            pass

        if "users" in existing_tables:
            user_columns = {col["name"] for col in inspector.get_columns("users")}
            new_user_cols = [
                ("subscription_tier", "VARCHAR(50) DEFAULT 'PRO'"),
                ("subscription_status", "VARCHAR(50) DEFAULT 'ACTIVE'"),
                ("stripe_customer_id", "VARCHAR(100)"),
                ("paymob_customer_id", "VARCHAR(100)"),
                ("billing_cycle", "VARCHAR(20) DEFAULT 'monthly'"),
                ("currency", "VARCHAR(10) DEFAULT 'EGP'"),
            ]
            with engine.connect() as conn:
                for col_name, col_type in new_user_cols:
                    if col_name not in user_columns:
                        try:
                            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception:
                            pass
    except Exception as e:
        print(f"[Migration Warning] Auto-migration check encountered: {e}")


def init_db():
    Base.metadata.create_all(bind=engine)
    run_migrations()
