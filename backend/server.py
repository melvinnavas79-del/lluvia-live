from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
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
import random
import shutil

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
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
    # Create a copy to avoid modifying original
    user_copy = dict(user)
    user_copy.pop('password', None)
    user_copy.pop('_id', None)
    return user_copy

def serialize_room(room: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure clean room serialization"""
    if not room:
        return None
    # Create a copy to avoid modifying original
    room_copy = dict(room)
    room_copy.pop('_id', None)
    return room_copy

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
        "role": "usuario",
        "is_admin": False,
        "ghost_mode": False,
        "total_spent": 0,
        "total_received": 0,
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
    
    # Check for Bebé Robot prize (15M when room owner reaches 50M)
    if user.get('coins', 0) >= 50000000:
        # Check if user owns a room
        owned_room = await db.rooms.find_one({"owner_id": user_id})
        if owned_room:
            last_prize = user.get('last_baby_robot_prize', 0)
            if user['coins'] - last_prize >= 50000000:
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
    
    # Check Bebé Robot prize when creating room (if owner has 50M+)
    if owner.get('coins', 0) >= 50000000:
        last_prize = owner.get('last_baby_robot_prize', 0)
        if owner['coins'] - last_prize >= 50000000:
            await db.users.update_one(
                {"id": owner_id},
                {"$inc": {"coins": 15000000}, "$set": {"last_baby_robot_prize": owner['coins']}}
            )
    
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

# ==================== ROLES & ADMIN ====================

# Role hierarchy: dueño > admin > moderador > supervisor > usuario
ROLE_HIERARCHY = {
    "dueño": 5,
    "admin": 4,
    "moderador": 3,
    "supervisor": 2,
    "usuario": 1
}

ROLE_BADGES = {
    "dueño": ["👑 Dueño", "🌟 Fundador", "⭐ Admin", "💎 VIP", "✅ Verificado", "💎 Aristocrat IX"],
    "admin": ["⭐ Admin", "💎 VIP", "✅ Verificado"],
    "moderador": ["🛡️ Moderador", "✅ Verificado"],
    "supervisor": ["👁️ Supervisor"],
    "usuario": ["🌟 Nuevo"]
}

def has_permission(user_role: str, required_role: str) -> bool:
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)

@api_router.post("/admin/set-owner")
async def set_owner(user_id: str, owner_key: str):
    if owner_key != "lluvia_owner_melvin":
        raise HTTPException(status_code=403, detail="Clave inválida")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "role": "dueño",
            "is_admin": True,
            "vip_status": "DUEÑO",
            "aristocracy": 9,
            "level": 99,
            "coins": 999999,
            "diamonds": 50000,
            "badges": ROLE_BADGES["dueño"],
            "ghost_mode": False
        }}
    )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return serialize_user(user)

@api_router.post("/admin/set-admin")
async def set_admin(user_id: str, admin_key: str):
    if admin_key != "lluvia_admin_2024":
        raise HTTPException(status_code=403, detail="Clave inválida")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_admin": True, "role": "admin", "vip_status": "ADMIN", "badges": ROLE_BADGES["admin"]}}
    )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return serialize_user(user)

@api_router.post("/admin/set-role")
async def set_role(user_id: str, admin_id: str, role: str):
    admin = await db.users.find_one({"id": admin_id})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin no encontrado")
    
    admin_role = admin.get('role', 'usuario')
    if not has_permission(admin_role, 'admin'):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    if role not in ROLE_HIERARCHY:
        raise HTTPException(status_code=400, detail="Rol inválido")
    
    # Can't assign role equal or higher than yours (except dueño can do anything)
    if admin_role != "dueño" and ROLE_HIERARCHY.get(role, 0) >= ROLE_HIERARCHY.get(admin_role, 0):
        raise HTTPException(status_code=403, detail="No puedes asignar un rol igual o mayor al tuyo")
    
    is_admin = role in ["dueño", "admin"]
    vip_map = {"dueño": "DUEÑO", "admin": "ADMIN", "moderador": "MODERADOR", "supervisor": "SUPERVISOR", "usuario": "NORMAL"}
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "role": role,
            "is_admin": is_admin,
            "vip_status": vip_map.get(role, "NORMAL"),
            "badges": ROLE_BADGES.get(role, ROLE_BADGES["usuario"])
        }}
    )
    
    user = await db.users.find_one({"id": user_id})
    return serialize_user(user)

@api_router.get("/admin/users")
async def admin_get_users(admin_id: str):
    admin = await db.users.find_one({"id": admin_id})
    if not admin:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    admin_role = admin.get('role', 'usuario')
    if not has_permission(admin_role, 'supervisor'):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    users = await db.users.find().to_list(500)
    return [serialize_user(u) for u in users]

@api_router.get("/admin/staff")
async def get_staff(admin_id: str):
    admin = await db.users.find_one({"id": admin_id})
    if not admin:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    admin_role = admin.get('role', 'usuario')
    if not has_permission(admin_role, 'moderador'):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    staff = await db.users.find({"role": {"$in": ["dueño", "admin", "moderador", "supervisor"]}}).to_list(100)
    return [serialize_user(s) for s in staff]

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, admin_id: str, updates: Dict[str, Any]):
    admin = await db.users.find_one({"id": admin_id})
    if not admin:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    admin_role = admin.get('role', 'usuario')
    if not has_permission(admin_role, 'moderador'):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    updates.pop('password', None)
    updates.pop('_id', None)
    updates.pop('id', None)
    
    # Only dueño/admin can change roles
    if 'role' in updates and not has_permission(admin_role, 'admin'):
        updates.pop('role', None)
    
    await db.users.update_one({"id": user_id}, {"$set": updates})
    user = await db.users.find_one({"id": user_id})
    return serialize_user(user)

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin_id: str):
    admin = await db.users.find_one({"id": admin_id})
    if not admin:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    admin_role = admin.get('role', 'usuario')
    if not has_permission(admin_role, 'admin'):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    target = await db.users.find_one({"id": user_id})
    if target and target.get('role') == 'dueño':
        raise HTTPException(status_code=403, detail="No puedes eliminar al dueño")
    
    await db.users.delete_one({"id": user_id})
    return {"success": True}

@api_router.delete("/admin/rooms/{room_id}")
async def admin_delete_room(room_id: str, admin_id: str):
    admin = await db.users.find_one({"id": admin_id})
    if not admin:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    admin_role = admin.get('role', 'usuario')
    if not has_permission(admin_role, 'moderador'):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    await db.rooms.delete_one({"id": room_id})
    return {"success": True}

# ==================== GHOST MODE ====================

@api_router.post("/users/{user_id}/ghost-mode")
async def toggle_ghost_mode(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user_role = user.get('role', 'usuario')
    if not has_permission(user_role, 'admin'):
        raise HTTPException(status_code=403, detail="Solo admin o dueño puede usar Modo Fantasma")
    
    new_mode = not user.get('ghost_mode', False)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"ghost_mode": new_mode}}
    )
    
    return {"success": True, "ghost_mode": new_mode}

# ==================== REELS ====================

class ReelCreate(BaseModel):
    user_id: str
    title: str
    description: str = ""
    video_url: str = ""

@api_router.post("/reels")
async def create_reel(reel: ReelCreate):
    user = await db.users.find_one({"id": reel.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    reel_id = str(uuid.uuid4())
    reel_doc = {
        "id": reel_id,
        "user_id": reel.user_id,
        "username": user['username'],
        "avatar": user['avatar'],
        "title": reel.title,
        "description": reel.description,
        "video_url": reel.video_url,
        "likes": 0,
        "liked_by": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reels.insert_one(reel_doc)
    reel_doc.pop('_id', None)
    return reel_doc

@api_router.get("/reels")
async def get_reels():
    reels = await db.reels.find().sort("created_at", -1).to_list(100)
    return [dict(r, **{"_id": None}) if "_id" in r else r for r in [{k: v for k, v in reel.items() if k != "_id"} for reel in reels]]

@api_router.post("/reels/{reel_id}/like")
async def like_reel(reel_id: str, user_id: str):
    reel = await db.reels.find_one({"id": reel_id})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel no encontrado")
    
    liked_by = reel.get('liked_by', [])
    if user_id in liked_by:
        liked_by.remove(user_id)
        inc = -1
    else:
        liked_by.append(user_id)
        inc = 1
    
    await db.reels.update_one(
        {"id": reel_id},
        {"$set": {"liked_by": liked_by}, "$inc": {"likes": inc}}
    )
    
    return {"success": True, "likes": reel.get('likes', 0) + inc}

@api_router.post("/reels/{reel_id}/comment")
async def comment_reel(reel_id: str, user_id: str, text: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    comment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "username": user['username'],
        "text": text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reels.update_one(
        {"id": reel_id},
        {"$push": {"comments": comment}}
    )
    
    return {"success": True, "comment": comment}

# ==================== PHOTOS ====================

class PhotoCreate(BaseModel):
    user_id: str
    title: str
    image_url: str
    description: str = ""

@api_router.post("/photos")
async def create_photo(photo: PhotoCreate):
    user = await db.users.find_one({"id": photo.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    photo_id = str(uuid.uuid4())
    photo_doc = {
        "id": photo_id,
        "user_id": photo.user_id,
        "username": user['username'],
        "avatar": user['avatar'],
        "title": photo.title,
        "image_url": photo.image_url,
        "description": photo.description,
        "likes": 0,
        "liked_by": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.photos.insert_one(photo_doc)
    photo_doc.pop('_id', None)
    return photo_doc

@api_router.get("/photos")
async def get_photos():
    photos = await db.photos.find().sort("created_at", -1).to_list(100)
    return [{k: v for k, v in p.items() if k != "_id"} for p in photos]

@api_router.post("/photos/{photo_id}/like")
async def like_photo(photo_id: str, user_id: str):
    photo = await db.photos.find_one({"id": photo_id})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    liked_by = photo.get('liked_by', [])
    if user_id in liked_by:
        liked_by.remove(user_id)
        inc = -1
    else:
        liked_by.append(user_id)
        inc = 1
    
    await db.photos.update_one(
        {"id": photo_id},
        {"$set": {"liked_by": liked_by}, "$inc": {"likes": inc}}
    )
    
    return {"success": True, "likes": photo.get('likes', 0) + inc}

@api_router.get("/rankings/coins")
async def get_coins_ranking():
    users = await db.users.find().sort("coins", -1).limit(50).to_list(50)
    return [serialize_user(u) for u in users]

@api_router.get("/rankings/level")
async def get_level_ranking():
    users = await db.users.find().sort("level", -1).limit(50).to_list(50)
    return [serialize_user(u) for u in users]

# ==================== GAMES ====================

class GameBet(BaseModel):
    user_id: str
    bet_amount: int

class RPSBet(BaseModel):
    user_id: str
    bet_amount: int
    choice: str  # piedra, papel, tijera

class TriviaBet(BaseModel):
    user_id: str
    bet_amount: int
    answer_index: int

class CardBet(BaseModel):
    user_id: str
    bet_amount: int
    guess: str  # mayor, menor

TRIVIA_QUESTIONS = [
    {"question": "¿Cuál es el planeta más grande del sistema solar?", "options": ["Tierra", "Júpiter", "Saturno", "Marte"], "correct": 1},
    {"question": "¿En qué año llegó el hombre a la Luna?", "options": ["1965", "1969", "1972", "1968"], "correct": 1},
    {"question": "¿Cuál es el océano más grande?", "options": ["Atlántico", "Índico", "Pacífico", "Ártico"], "correct": 2},
    {"question": "¿Cuántos continentes hay?", "options": ["5", "6", "7", "8"], "correct": 2},
    {"question": "¿Cuál es el animal más rápido?", "options": ["León", "Guepardo", "Águila", "Caballo"], "correct": 1},
    {"question": "¿Cuál es el río más largo del mundo?", "options": ["Nilo", "Amazonas", "Misisipi", "Yangtsé"], "correct": 0},
    {"question": "¿Quién pintó la Mona Lisa?", "options": ["Miguel Ángel", "Da Vinci", "Rafael", "Botticelli"], "correct": 1},
    {"question": "¿Cuál es el metal más caro?", "options": ["Oro", "Platino", "Rodio", "Plata"], "correct": 2},
    {"question": "¿Cuántos huesos tiene el cuerpo humano?", "options": ["186", "206", "226", "256"], "correct": 1},
    {"question": "¿Cuál es el país más grande del mundo?", "options": ["China", "Canadá", "Rusia", "EE.UU."], "correct": 2},
]

@api_router.post("/games/ruleta")
async def play_ruleta(bet: GameBet):
    user = await db.users.find_one({"id": bet.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user['coins'] < bet.bet_amount:
        raise HTTPException(status_code=400, detail="No tienes suficientes monedas")
    if bet.bet_amount < 100:
        raise HTTPException(status_code=400, detail="Apuesta mínima: 100")

    prizes = [
        {"multiplier": 0, "label": "Sin suerte", "chance": 30},
        {"multiplier": 1.5, "label": "x1.5", "chance": 25},
        {"multiplier": 2, "label": "x2", "chance": 20},
        {"multiplier": 3, "label": "x3", "chance": 15},
        {"multiplier": 5, "label": "x5", "chance": 7},
        {"multiplier": 10, "label": "JACKPOT x10", "chance": 3},
    ]
    
    roll = random.randint(1, 100)
    cumulative = 0
    selected = prizes[0]
    for p in prizes:
        cumulative += p["chance"]
        if roll <= cumulative:
            selected = p
            break
    
    winnings = int(bet.bet_amount * selected["multiplier"])
    net = winnings - bet.bet_amount
    
    await db.users.update_one(
        {"id": bet.user_id},
        {"$inc": {"coins": net}}
    )
    
    updated_user = await db.users.find_one({"id": bet.user_id})
    
    return {
        "result": selected["label"],
        "multiplier": selected["multiplier"],
        "bet": bet.bet_amount,
        "winnings": winnings,
        "net": net,
        "new_balance": updated_user['coins']
    }

@api_router.post("/games/dados")
async def play_dados(bet: GameBet):
    user = await db.users.find_one({"id": bet.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user['coins'] < bet.bet_amount:
        raise HTTPException(status_code=400, detail="No tienes suficientes monedas")
    if bet.bet_amount < 100:
        raise HTTPException(status_code=400, detail="Apuesta mínima: 100")

    dice1 = random.randint(1, 6)
    dice2 = random.randint(1, 6)
    total = dice1 + dice2
    
    if total >= 10:
        multiplier = 3
        result = "GRAN VICTORIA"
    elif total >= 7:
        multiplier = 2
        result = "Victoria"
    elif total == 7:
        multiplier = 1.5
        result = "Empate"
    else:
        multiplier = 0
        result = "Perdiste"
    
    winnings = int(bet.bet_amount * multiplier)
    net = winnings - bet.bet_amount
    
    await db.users.update_one(
        {"id": bet.user_id},
        {"$inc": {"coins": net}}
    )
    
    updated_user = await db.users.find_one({"id": bet.user_id})
    
    return {
        "dice1": dice1,
        "dice2": dice2,
        "total": total,
        "result": result,
        "multiplier": multiplier,
        "bet": bet.bet_amount,
        "winnings": winnings,
        "net": net,
        "new_balance": updated_user['coins']
    }

@api_router.post("/games/piedra-papel-tijera")
async def play_rps(bet: RPSBet):
    user = await db.users.find_one({"id": bet.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user['coins'] < bet.bet_amount:
        raise HTTPException(status_code=400, detail="No tienes suficientes monedas")
    if bet.bet_amount < 100:
        raise HTTPException(status_code=400, detail="Apuesta mínima: 100")

    choices = ["piedra", "papel", "tijera"]
    if bet.choice not in choices:
        raise HTTPException(status_code=400, detail="Opción inválida")
    
    computer = random.choice(choices)
    
    if bet.choice == computer:
        result = "empate"
        multiplier = 1
    elif (bet.choice == "piedra" and computer == "tijera") or \
         (bet.choice == "papel" and computer == "piedra") or \
         (bet.choice == "tijera" and computer == "papel"):
        result = "ganaste"
        multiplier = 2
    else:
        result = "perdiste"
        multiplier = 0
    
    winnings = int(bet.bet_amount * multiplier)
    net = winnings - bet.bet_amount
    
    await db.users.update_one(
        {"id": bet.user_id},
        {"$inc": {"coins": net}}
    )
    
    updated_user = await db.users.find_one({"id": bet.user_id})
    
    return {
        "player_choice": bet.choice,
        "computer_choice": computer,
        "result": result,
        "multiplier": multiplier,
        "bet": bet.bet_amount,
        "winnings": winnings,
        "net": net,
        "new_balance": updated_user['coins']
    }

@api_router.get("/games/trivia/question")
async def get_trivia_question():
    q = random.choice(TRIVIA_QUESTIONS)
    return {
        "question": q["question"],
        "options": q["options"],
        "question_id": TRIVIA_QUESTIONS.index(q)
    }

@api_router.post("/games/trivia")
async def play_trivia(bet: TriviaBet):
    user = await db.users.find_one({"id": bet.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user['coins'] < bet.bet_amount:
        raise HTTPException(status_code=400, detail="No tienes suficientes monedas")
    if bet.bet_amount < 100:
        raise HTTPException(status_code=400, detail="Apuesta mínima: 100")

    q = random.choice(TRIVIA_QUESTIONS)
    correct = q["correct"] == bet.answer_index
    
    multiplier = 3 if correct else 0
    winnings = int(bet.bet_amount * multiplier)
    net = winnings - bet.bet_amount
    
    await db.users.update_one(
        {"id": bet.user_id},
        {"$inc": {"coins": net}}
    )
    
    updated_user = await db.users.find_one({"id": bet.user_id})
    
    return {
        "correct": correct,
        "correct_answer": q["options"][q["correct"]],
        "result": "Correcto x3" if correct else "Incorrecto",
        "multiplier": multiplier,
        "bet": bet.bet_amount,
        "winnings": winnings,
        "net": net,
        "new_balance": updated_user['coins']
    }

@api_router.post("/games/carta-mayor")
async def play_carta_mayor(bet: CardBet):
    user = await db.users.find_one({"id": bet.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user['coins'] < bet.bet_amount:
        raise HTTPException(status_code=400, detail="No tienes suficientes monedas")
    if bet.bet_amount < 100:
        raise HTTPException(status_code=400, detail="Apuesta mínima: 100")
    if bet.guess not in ["mayor", "menor"]:
        raise HTTPException(status_code=400, detail="Opción inválida")

    cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    card_values = {"A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13}
    
    card1 = random.choice(cards)
    card2 = random.choice(cards)
    
    val1 = card_values[card1]
    val2 = card_values[card2]
    
    if val1 == val2:
        correct = False
        result = "Empate - Pierdes"
    elif bet.guess == "mayor":
        correct = val2 > val1
    else:
        correct = val2 < val1
    
    multiplier = 2 if correct else 0
    winnings = int(bet.bet_amount * multiplier)
    net = winnings - bet.bet_amount
    
    await db.users.update_one(
        {"id": bet.user_id},
        {"$inc": {"coins": net}}
    )
    
    updated_user = await db.users.find_one({"id": bet.user_id})
    
    return {
        "card1": card1,
        "card2": card2,
        "guess": bet.guess,
        "correct": correct,
        "result": "Ganaste x2" if correct else "Perdiste",
        "multiplier": multiplier,
        "bet": bet.bet_amount,
        "winnings": winnings,
        "net": net,
        "new_balance": updated_user['coins']
    }

# ==================== FILE UPLOAD ====================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'bin'
    allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm', 'mp3', 'wav']
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Formato no soportado. Usa: {', '.join(allowed)}")
    
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    file_url = f"/api/uploads/{filename}"
    return {"success": True, "url": file_url, "filename": filename}

# ==================== SETUP ====================

app.include_router(api_router)

# Serve uploaded files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

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
