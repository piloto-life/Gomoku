import asyncio
from datetime import datetime, timedelta
import logging
from database import get_database, get_fs

logger = logging.getLogger(__name__)

class CleanupService:
    def __init__(self):
        self.running = False
        self.cleanup_interval = 3600  # Run every hour
        self.max_storage_bytes = 1 * 1024 * 1024 * 1024  # 1 GB
        self.retention_days = 15

    async def start(self):
        self.running = True
        logger.info("Starting cleanup service...")
        # Initial wait to let server start up
        await asyncio.sleep(10)
        
        while self.running:
            try:
                logger.info("Running scheduled cleanup...")
                await self.cleanup_old_videos()
                await self.cleanup_storage_limit()
            except Exception as e:
                logger.error(f"Error in cleanup service: {e}")
            
            # Wait for next interval
            try:
                await asyncio.sleep(self.cleanup_interval)
            except asyncio.CancelledError:
                break

    def stop(self):
        self.running = False
        logger.info("Stopping cleanup service...")

    async def cleanup_old_videos(self):
        """Delete videos older than retention period"""
        try:
            db = await get_database()
            fs = await get_fs()
            
            cutoff_date = datetime.utcnow() - timedelta(days=self.retention_days)
            
            # Find videos older than cutoff
            # GridFS stores uploadDate in fs.files
            cursor = fs.find({"uploadDate": {"$lt": cutoff_date}})
            
            count = 0
            async for file_doc in cursor:
                await fs.delete(file_doc._id)
                # Also delete from recordings collection if exists
                await db.recordings.delete_one({"file_id": file_doc._id})
                count += 1
                
            if count > 0:
                logger.info(f"Cleaned up {count} old videos")
                
        except Exception as e:
            logger.error(f"Error cleaning old videos: {e}")

    async def cleanup_storage_limit(self):
        """Ensure total video storage does not exceed limit"""
        try:
            fs = await get_fs()
            db = await get_database()
            
            # Calculate total size
            total_size = 0
            files = []
            # Get all files, sorted by oldest first
            async for file_doc in fs.find().sort("uploadDate", 1):
                total_size += file_doc.length
                files.append(file_doc)
            
            # Check if we exceed the limit
            if total_size > self.max_storage_bytes:
                bytes_to_free = total_size - self.max_storage_bytes
                freed_bytes = 0
                deleted_count = 0
                
                logger.info(f"Storage limit exceeded ({total_size/1024/1024:.2f} MB > {self.max_storage_bytes/1024/1024:.2f} MB). Cleaning up...")
                
                for file_doc in files:
                    if freed_bytes >= bytes_to_free:
                        break
                        
                    await fs.delete(file_doc._id)
                    await db.recordings.delete_one({"file_id": file_doc._id})
                    
                    freed_bytes += file_doc.length
                    deleted_count += 1
                    
                logger.info(f"Deleted {deleted_count} videos, freed {freed_bytes/1024/1024:.2f} MB")
                
        except Exception as e:
            logger.error(f"Error checking storage limit: {e}")

cleanup_service = CleanupService()
