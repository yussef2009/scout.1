"""
SCOT AI — MongoDB Atlas Async Database Layer
Powered by Motor (AsyncIO driver for MongoDB) with connection pooling and index management.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo

from .config import settings
from .models import MatchDocument, VolleyballTelemetry

logger = logging.getLogger("scot_ai.database")

# Module-level connection singletons
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None

MATCHES_COLLECTION = "matches"


async def connect_to_mongo() -> None:
    """
    Initializes AsyncIOMotorClient with connection pooling, tests the connection
    via ping, and ensures necessary database indexes exist.
    """
    global _client, _db
    if _client is not None:
        logger.debug("MongoDB connection is already active.")
        return

    logger.info("Connecting to MongoDB Atlas at %s...", settings.MONGODB_URI.split("@")[-1] if "@" in settings.MONGODB_URI else settings.MONGODB_URI)
    try:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=45000,
            retryWrites=True,
            uuidRepresentation="standard",
        )
        _db = _client[settings.MONGODB_DB_NAME]

        # Verify cluster reachability
        await _db.command("ping")
        logger.info("Successfully established connection to MongoDB Atlas database: '%s'", settings.MONGODB_DB_NAME)

        # Enforce performance & integrity indexes
        matches_coll = _db[MATCHES_COLLECTION]
        await matches_coll.create_index(
            [("match_id", pymongo.ASCENDING)],
            unique=True,
            name="idx_match_id_unique",
        )
        await matches_coll.create_index(
            [("clerk_user_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)],
            name="idx_user_created_at",
        )
        await matches_coll.create_index(
            [("status", pymongo.ASCENDING)],
            name="idx_match_status",
        )
        logger.info("MongoDB Atlas indexes verified on '%s' collection.", MATCHES_COLLECTION)

    except Exception as exc:
        logger.critical("Failed to connect to MongoDB Atlas: %s", exc, exc_info=True)
        _client = None
        _db = None
        raise


async def close_mongo_connection() -> None:
    """Gracefully terminates all open MongoDB Atlas connections on application shutdown."""
    global _client, _db
    if _client is not None:
        logger.info("Closing MongoDB Atlas connection pool...")
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB Atlas connection closed successfully.")


def get_database() -> AsyncIOMotorDatabase:
    """Returns the active MongoDB database instance, raising an error if disconnected."""
    if _db is None:
        raise RuntimeError("MongoDB is not connected. Call connect_to_mongo() first.")
    return _db


# ── Match Document Helper Functions ───────────────────────────────────────────

async def create_match_record(match: MatchDocument) -> str:
    """
    Inserts a newly queued match analysis document into MongoDB.
    Returns the unique match_id.
    """
    db = get_database()
    coll = db[MATCHES_COLLECTION]
    doc = match.model_dump()
    await coll.insert_one(doc)
    logger.info("Created match document in MongoDB: match_id=%s, user=%s", match.match_id, match.clerk_user_id)
    return match.match_id


async def update_match_telemetry(
    match_id: str,
    annotated_video_url: str,
    telemetry: VolleyballTelemetry,
    status: str = "completed",
) -> bool:
    """
    Updates a match record upon successful completion of the computer vision pipeline.
    Saves the Appwrite video URL and telemetry metrics.
    """
    db = get_database()
    coll = db[MATCHES_COLLECTION]

    now = datetime.now(timezone.utc)
    update_data: Dict[str, Any] = {
        "status": status,
        "annotated_video_url": annotated_video_url,
        "telemetry_summary": telemetry.model_dump(),
        "updated_at": now,
        "error_message": None,
    }

    result = await coll.update_one(
        {"match_id": match_id},
        {"$set": update_data},
    )
    success = result.modified_count > 0 or result.matched_count > 0
    if success:
        logger.info("Updated telemetry for match_id=%s (status=%s)", match_id, status)
    else:
        logger.warning("No document found to update for match_id=%s", match_id)
    return success


async def update_match_status(
    match_id: str,
    status: str,
    error_message: Optional[str] = None,
    raw_video_file_id: Optional[str] = None,
) -> bool:
    """
    Updates the execution status (queued, processing, failed) or error diagnostics.
    """
    db = get_database()
    coll = db[MATCHES_COLLECTION]

    now = datetime.now(timezone.utc)
    set_fields: Dict[str, Any] = {
        "status": status,
        "updated_at": now,
    }
    if error_message is not None:
        set_fields["error_message"] = error_message
    if raw_video_file_id is not None:
        set_fields["raw_video_file_id"] = raw_video_file_id

    result = await coll.update_one(
        {"match_id": match_id},
        {"$set": set_fields},
    )
    return result.matched_count > 0


async def get_user_matches(clerk_user_id: str, limit: int = 50) -> List[MatchDocument]:
    """
    Retrieves all match documents for a specific Clerk user, sorted newest first.
    """
    db = get_database()
    coll = db[MATCHES_COLLECTION]

    cursor = (
        coll.find({"clerk_user_id": clerk_user_id})
        .sort("created_at", pymongo.DESCENDING)
        .limit(limit)
    )
    matches: List[MatchDocument] = []
    async for doc in cursor:
        doc.pop("_id", None)
        matches.append(MatchDocument(**doc))
    return matches


async def get_match_by_id(match_id: str) -> Optional[MatchDocument]:
    """
    Fetches a single match report by its unique match_id.
    """
    db = get_database()
    coll = db[MATCHES_COLLECTION]

    doc = await coll.find_one({"match_id": match_id})
    if not doc:
        return None
    doc.pop("_id", None)
    return MatchDocument(**doc)

