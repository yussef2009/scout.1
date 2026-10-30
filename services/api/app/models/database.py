import os
import logging
from sqlalchemy import create_engine, inspect, text, event
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("scoutai.database")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://scout:scoutpass@localhost:5432/scoutai_db")
SQLITE_FALLBACK = os.getenv("SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")

engine = None
SessionLocal = None
Base = declarative_base()

try:
    if not SQLITE_FALLBACK and DATABASE_URL.startswith("postgresql"):
        # Production PostgreSQL engine with tuned connection pooling to prevent connection starvation
        engine = create_engine(
            DATABASE_URL,
            pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
            pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
            pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
            pool_pre_ping=True,
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info("[Database] Connected to PostgreSQL with connection pooling enabled.")
    else:
        # SQLite local fallback with WAL journal mode and busy timeout for concurrent threads
        sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scoutai_dev.db"))
        sqlite_url = f"sqlite:///{sqlite_path}"
        engine = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False, "timeout": 15},
        )

        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()

        print(f"[Database] Using local SQLite database at: {sqlite_url}")
except Exception as e:
    logger.warning(f"[Database Warning] PostgreSQL connection failed ({e}). Falling back to SQLite.")
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scoutai_dev.db"))
    sqlite_url = f"sqlite:///{sqlite_path}"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False, "timeout": 15},
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma_fallback(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

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
    Adds subscription, billing, and foreign key columns if upgrading existing local databases.
    """
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        is_postgres = engine.dialect.name == "postgresql"
        timestamp_type = "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"

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
                ("current_period_start", timestamp_type),
                ("current_period_end", timestamp_type),
            ]
            with engine.connect() as conn:
                for col_name, col_type in new_org_cols:
                    if col_name not in org_columns:
                        try:
                            conn.execute(text(f"ALTER TABLE organizations ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception as ddl_err:
                            logger.debug(f"[Migration] Column {col_name} on organizations already exists or failed: {ddl_err}")

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
                        except Exception as ddl_err:
                            logger.debug(f"[Migration] Column {col_name} on users already exists or failed: {ddl_err}")

        if "scouting_reports" in existing_tables:
            report_columns = {col["name"] for col in inspector.get_columns("scouting_reports")}
            new_report_cols = [
                ("org_id", "VARCHAR(36)"),
                ("executive_summary", "TEXT"),
                ("tactical_profile", "TEXT"),
                ("volleyball_metrics", "JSON"),
                ("volleyball_events", "JSON"),
                ("dvw_strings", "JSON"),
            ]
            with engine.connect() as conn:
                for col_name, col_type in new_report_cols:
                    if col_name not in report_columns:
                        try:
                            conn.execute(text(f"ALTER TABLE scouting_reports ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception as ddl_err:
                            logger.debug(f"[Migration] Column {col_name} on scouting_reports already exists or failed: {ddl_err}")

    except Exception as e:
        logger.warning(f"[Migration Warning] Auto-migration check encountered: {e}")


def init_db():
    Base.metadata.create_all(bind=engine)
    run_migrations()


# Ensure tables and migrations on module load
try:
    init_db()
except Exception as _e:
    logger.debug(f"[Database] Startup schema init note: {_e}")

