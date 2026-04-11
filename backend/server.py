from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
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

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    level: int = 1
    coins: int = 1000
    diamonds: int = 0
    aristocracy: int = 0
    vip_status: str = "NORMAL"  # NORMAL, VIP, SVIP, ARISTOCRAT
    badges: List[str] = []
    avatar: str = "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Room(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_id: str
    owner_name: str
    active_users: int = 0
    max_seats: int = 9
    seats: List[Optional[dict]] = Field(default_factory=lambda: [None] * 9)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RoomCreate(BaseModel):
    name: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def get_level_info(level: int) -> dict:
    levels = {
        1: {"name": "Bronce", "emoji": "🥉"},
        2: {"name": "Plata", "emoji": "👑👑"},
        3: {"name": "Oro", "emoji": "👑👑👑"},
        4: {"name": "Diamante Azul", "emoji": "💎"},
        5: {"name": "Esmeralda", "emoji": "💎💎"},
        6: {"name": "Rubí", "emoji": "💎💎💎"},
        7: {"name": "Zafiro", "emoji": "👑💎"},
        8: {"name": "Arcoíris", "emoji": "👑💎👑"},
        9: {"name": "SUPREMO", "emoji": "👑💎👑💎"}
    }
    return levels.get(level, levels[1])

# ==================== USER ROUTES ====================

@api_router.post("/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Usuario ya existe")
    
    # Create user
    user = User(
        username=user_data.username,
        badges=["🌟 Nuevo"]
    )
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Return without password
    del user_dict['password']
    return {"success": True, "user": user_dict}

@api_router.post("/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    del user['password']
    return {"success": True, "user": user}

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, updates: dict):
    # Remove password from updates if present
    updates.pop('password', None)
    updates.pop('id', None)
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return user

# ==================== ROOM ROUTES ====================

@api_router.post("/rooms")
async def create_room(room_data: RoomCreate, owner_id: str):
    owner = await db.users.find_one({"id": owner_id}, {"_id": 0})
    if not owner:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    room = Room(
        name=room_data.name,
        owner_id=owner_id,
        owner_name=owner['username']
    )
    
    room_dict = room.model_dump()
    await db.rooms.insert_one(room_dict)
    return room_dict

@api_router.get("/rooms")
async def get_rooms():
    rooms = await db.rooms.find({}, {"_id": 0}).to_list(100)
    return rooms

@api_router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return room

@api_router.post("/rooms/{room_id}/join")
async def join_room(room_id: str, user_id: str, seat_index: int):
    room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Update seat
    seats = room.get('seats', [None] * 9)
    if seat_index >= len(seats) or seats[seat_index] is not None:
        raise HTTPException(status_code=400, detail="Asiento no disponible")
    
    seats[seat_index] = {
        "user_id": user_id,
        "username": user['username'],
        "avatar": user['avatar'],
        "level": user['level'],
        "is_muted": False
    }
    
    await db.rooms.update_one(
        {"id": room_id},
        {"$set": {"seats": seats, "active_users": sum(1 for s in seats if s)}}
    )
    
    return {"success": True}

@api_router.post("/rooms/{room_id}/leave")
async def leave_room(room_id: str, user_id: str):
    room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    seats = room.get('seats', [])
    for i, seat in enumerate(seats):
        if seat and seat.get('user_id') == user_id:
            seats[i] = None
    
    await db.rooms.update_one(
        {"id": room_id},
        {"$set": {"seats": seats, "active_users": sum(1 for s in seats if s)}}
    )
    
    return {"success": True}

# ==================== RANKINGS ====================

@api_router.get("/rankings/coins")
async def get_coins_ranking():
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0}
    ).sort("coins", -1).limit(50).to_list(50)
    return users

@api_router.get("/rankings/level")
async def get_level_ranking():
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0}
    ).sort("level", -1).limit(50).to_list(50)
    return users

# ==================== APP SETUP ====================

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
