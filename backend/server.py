from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class RoomCreate(BaseModel):
    name: str

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive data and ensure clean serialization"""
    if not user:
        return None
    user.pop('password', None)
    user.pop('_id', None)
    return user

def serialize_room(room: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure clean room serialization"""
    if not room:
        return None
    room.pop('_id', None)
    return room

# ==================== USER ROUTES ====================

@api_router.post("/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Usuario ya existe")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "password": hash_password(user_data.password),
        "level": 1,
        "coins": 1000,
        "diamonds": 0,
        "aristocracy": 0,
        "vip_status": "NORMAL",
        "badges": ["🌟 Nuevo"],
        "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    return {"success": True, "user": serialize_user(user_doc)}

@api_router.post("/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username})
    
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    return {"success": True, "user": serialize_user(user)}

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return serialize_user(user)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, updates: Dict[str, Any]):
    updates.pop('password', None)
    updates.pop('id', None)
    updates.pop('_id', None)
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user = await db.users.find_one({"id": user_id})
    
    # Check for Bebé Robot prize (15M after reaching 70M)
    if user.get('coins', 0) >= 70000000:
        last_prize = user.get('last_baby_robot_prize', 0)
        if user['coins'] - last_prize >= 70000000:
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"coins": 15000000}, "$set": {"last_baby_robot_prize": user['coins']}}
            )
            user = await db.users.find_one({"id": user_id})
            user['baby_robot_awarded'] = True
    
    return serialize_user(user)

# ==================== ROOM ROUTES ====================

@api_router.post("/rooms")
async def create_room(room_data: RoomCreate, owner_id: str):
    owner = await db.users.find_one({"id": owner_id})
    if not owner:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    room_id = str(uuid.uuid4())
    room_doc = {
        "id": room_id,
        "name": room_data.name,
        "owner_id": owner_id,
        "owner_name": owner['username'],
        "active_users": 0,
        "max_seats": 9,
        "seats": [None] * 9,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rooms.insert_one(room_doc)
    return serialize_room(room_doc)

@api_router.get("/rooms")
async def get_rooms():
    rooms = await db.rooms.find().to_list(100)
    return [serialize_room(r) for r in rooms]

@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return serialize_room(room)

@api_router.post("/rooms/{room_id}/join")
async def join_room(room_id: str, user_id: str, seat_index: int):
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    seats = room.get('seats', [None] * 9)
    
    if seat_index >= len(seats):
        raise HTTPException(status_code=400, detail="Índice de asiento inválido")
    
    if seats[seat_index] is not None:
        raise HTTPException(status_code=400, detail="Asiento ocupado")
    
    seats[seat_index] = {
        "user_id": user_id,
        "username": user['username'],
        "avatar": user['avatar'],
        "level": user['level'],
        "is_muted": False,
        "audio_enabled": True
    }
    
    active_count = sum(1 for s in seats if s is not None)
    
    await db.rooms.update_one(
        {"id": room_id},
        {"$set": {"seats": seats, "active_users": active_count}}
    )
    
    return {"success": True, "seat_index": seat_index}

@api_router.post("/rooms/{room_id}/toggle-mute")
async def toggle_mute(room_id: str, user_id: str):
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    seats = room.get('seats', [])
    updated = False
    
    for i, seat in enumerate(seats):
        if seat and seat.get('user_id') == user_id:
            seats[i]['is_muted'] = not seat.get('is_muted', False)
            updated = True
            break
    
    if updated:
        await db.rooms.update_one(
            {"id": room_id},
            {"$set": {"seats": seats}}
        )
    
    return {"success": True}

@api_router.post("/rooms/{room_id}/leave")
async def leave_room(room_id: str, user_id: str):
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    seats = room.get('seats', [])
    updated = False
    
    for i, seat in enumerate(seats):
        if seat and seat.get('user_id') == user_id:
            seats[i] = None
            updated = True
    
    if updated:
        active_count = sum(1 for s in seats if s is not None)
        await db.rooms.update_one(
            {"id": room_id},
            {"$set": {"seats": seats, "active_users": active_count}}
        )
    
    return {"success": True}

@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str, owner_id: str):
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    if room['owner_id'] != owner_id:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    
    await db.rooms.delete_one({"id": room_id})
    return {"success": True}

# ==================== RANKINGS ====================

@api_router.get("/rankings/coins")
async def get_coins_ranking():
    users = await db.users.find().sort("coins", -1).limit(50).to_list(50)
    return [serialize_user(u) for u in users]

@api_router.get("/rankings/level")
async def get_level_ranking():
    users = await db.users.find().sort("level", -1).limit(50).to_list(50)
    return [serialize_user(u) for u in users]

# ==================== SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
