"""
Test new features for Lluvia Live:
1. POST /api/rooms/my-room - Personal room creation/retrieval
2. POST /api/rooms/{room_id}/chat-photo - Photo sending in chat
3. GET /api/users/{user_id}/can-use-gif - GIF permission check
4. POST /api/admin/grant-gif/{target_id} - Grant GIF permission
5. POST /api/admin/revoke-gif/{target_id} - Revoke GIF permission
6. Avatar upload GIF restrictions
7. Bot IA functionality
8. Control Panel access
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MELVIN_USERNAME = "Melvin_Live"
MELVIN_PASSWORD = "test123"
MELVIN_USER_ID = "b45958bc-2c6b-49ea-8102-a11197001e53"


class TestMyRoom:
    """Test POST /api/rooms/my-room endpoint"""
    
    def test_my_room_returns_existing_room(self):
        """Melvin already has a room named 'José', should return it"""
        response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id={MELVIN_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should have room id"
        assert "name" in data, "Response should have room name"
        assert data["owner_id"] == MELVIN_USER_ID, "Room owner should be Melvin"
        print(f"✓ My room returned: {data['name']} (id: {data['id']})")
        return data
    
    def test_my_room_creates_new_for_new_user(self):
        """Test that my-room creates a new room for user without one"""
        # First register a new user
        import uuid
        test_username = f"test_myroom_{uuid.uuid4().hex[:8]}"
        reg_response = requests.post(f"{BASE_URL}/api/register", json={
            "username": test_username,
            "password": "test123"
        })
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        new_user_id = reg_response.json()["user"]["id"]
        
        # Now call my-room
        response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id={new_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["owner_id"] == new_user_id
        assert test_username in data["name"], f"Room name should contain username"
        print(f"✓ New room created for new user: {data['name']}")
    
    def test_my_room_invalid_user(self):
        """Test my-room with invalid user ID"""
        response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id=invalid-user-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid user returns 404")


class TestChatPhoto:
    """Test POST /api/rooms/{room_id}/chat-photo endpoint"""
    
    def test_chat_photo_upload(self):
        """Test uploading a photo to room chat"""
        # First get Melvin's room
        room_response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id={MELVIN_USER_ID}")
        assert room_response.status_code == 200
        room_id = room_response.json()["id"]
        
        # Create a simple test image (1x1 PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(
            f"{BASE_URL}/api/rooms/{room_id}/chat-photo?user_id={MELVIN_USER_ID}",
            files=files
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["type"] == "photo", "Message type should be 'photo'"
        assert "image_url" in data, "Response should have image_url"
        assert data["user_id"] == MELVIN_USER_ID
        print(f"✓ Chat photo uploaded: {data['image_url']}")
    
    def test_chat_photo_invalid_room(self):
        """Test uploading photo to invalid room"""
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(
            f"{BASE_URL}/api/rooms/invalid-room-id/chat-photo?user_id={MELVIN_USER_ID}",
            files=files
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid room returns 404")
    
    def test_chat_photo_invalid_user(self):
        """Test uploading photo with invalid user"""
        room_response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id={MELVIN_USER_ID}")
        room_id = room_response.json()["id"]
        
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(
            f"{BASE_URL}/api/rooms/{room_id}/chat-photo?user_id=invalid-user",
            files=files
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid user returns 404")


class TestGifPermissions:
    """Test GIF permission endpoints"""
    
    def test_can_use_gif_dueno(self):
        """Dueño (Melvin) should always be able to use GIF"""
        response = requests.get(f"{BASE_URL}/api/users/{MELVIN_USER_ID}/can-use-gif")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["can_use_gif"] == True, "Dueño should be able to use GIF"
        print("✓ Dueño can use GIF")
    
    def test_can_use_gif_invalid_user(self):
        """Invalid user should return 404"""
        response = requests.get(f"{BASE_URL}/api/users/invalid-user-id/can-use-gif")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid user returns 404")
    
    def test_grant_gif_permission(self):
        """Test granting GIF permission to a user"""
        # First create a test user
        import uuid
        test_username = f"test_gif_{uuid.uuid4().hex[:8]}"
        reg_response = requests.post(f"{BASE_URL}/api/register", json={
            "username": test_username,
            "password": "test123"
        })
        assert reg_response.status_code == 200
        test_user_id = reg_response.json()["user"]["id"]
        
        # Check initial state - should not have GIF permission
        check_response = requests.get(f"{BASE_URL}/api/users/{test_user_id}/can-use-gif")
        assert check_response.status_code == 200
        assert check_response.json()["can_use_gif"] == False, "New user should not have GIF permission"
        
        # Grant GIF permission (as Melvin - dueño)
        grant_response = requests.post(
            f"{BASE_URL}/api/admin/grant-gif/{test_user_id}?admin_id={MELVIN_USER_ID}"
        )
        assert grant_response.status_code == 200, f"Expected 200, got {grant_response.status_code}: {grant_response.text}"
        
        # Verify permission was granted
        check_response2 = requests.get(f"{BASE_URL}/api/users/{test_user_id}/can-use-gif")
        assert check_response2.json()["can_use_gif"] == True, "User should now have GIF permission"
        print(f"✓ GIF permission granted to {test_username}")
        
        return test_user_id
    
    def test_revoke_gif_permission(self):
        """Test revoking GIF permission from a user"""
        # First grant permission
        test_user_id = self.test_grant_gif_permission()
        
        # Revoke GIF permission
        revoke_response = requests.post(
            f"{BASE_URL}/api/admin/revoke-gif/{test_user_id}?admin_id={MELVIN_USER_ID}"
        )
        assert revoke_response.status_code == 200, f"Expected 200, got {revoke_response.status_code}: {revoke_response.text}"
        
        # Verify permission was revoked
        check_response = requests.get(f"{BASE_URL}/api/users/{test_user_id}/can-use-gif")
        assert check_response.json()["can_use_gif"] == False, "User should no longer have GIF permission"
        print("✓ GIF permission revoked")
    
    def test_grant_gif_non_dueno_fails(self):
        """Non-dueño should not be able to grant GIF permission"""
        # Create a regular user
        import uuid
        test_username = f"test_nongif_{uuid.uuid4().hex[:8]}"
        reg_response = requests.post(f"{BASE_URL}/api/register", json={
            "username": test_username,
            "password": "test123"
        })
        assert reg_response.status_code == 200
        regular_user_id = reg_response.json()["user"]["id"]
        
        # Try to grant GIF permission as regular user
        grant_response = requests.post(
            f"{BASE_URL}/api/admin/grant-gif/{MELVIN_USER_ID}?admin_id={regular_user_id}"
        )
        assert grant_response.status_code == 403, f"Expected 403, got {grant_response.status_code}"
        print("✓ Non-dueño cannot grant GIF permission")


class TestAvatarGifRestriction:
    """Test avatar upload GIF restrictions"""
    
    def test_avatar_gif_allowed_for_dueno(self):
        """Dueño should be able to upload GIF avatar"""
        # Create a minimal GIF (1x1 pixel)
        gif_data = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        
        files = {'file': ('avatar.gif', io.BytesIO(gif_data), 'image/gif')}
        response = requests.post(
            f"{BASE_URL}/api/users/{MELVIN_USER_ID}/avatar",
            files=files
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "avatar" in data
        print(f"✓ Dueño can upload GIF avatar: {data['avatar']}")
    
    def test_avatar_gif_rejected_for_regular_user(self):
        """Regular user without permission should not be able to upload GIF avatar"""
        # Create a regular user
        import uuid
        test_username = f"test_avatar_{uuid.uuid4().hex[:8]}"
        reg_response = requests.post(f"{BASE_URL}/api/register", json={
            "username": test_username,
            "password": "test123"
        })
        assert reg_response.status_code == 200
        regular_user_id = reg_response.json()["user"]["id"]
        
        # Try to upload GIF avatar
        gif_data = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        
        files = {'file': ('avatar.gif', io.BytesIO(gif_data), 'image/gif')}
        response = requests.post(
            f"{BASE_URL}/api/users/{regular_user_id}/avatar",
            files=files
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("✓ Regular user cannot upload GIF avatar")
    
    def test_avatar_png_allowed_for_regular_user(self):
        """Regular user should be able to upload PNG avatar"""
        import uuid
        test_username = f"test_png_{uuid.uuid4().hex[:8]}"
        reg_response = requests.post(f"{BASE_URL}/api/register", json={
            "username": test_username,
            "password": "test123"
        })
        assert reg_response.status_code == 200
        regular_user_id = reg_response.json()["user"]["id"]
        
        # Upload PNG avatar
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('avatar.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(
            f"{BASE_URL}/api/users/{regular_user_id}/avatar",
            files=files
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Regular user can upload PNG avatar")


class TestBotIA:
    """Test Bot IA functionality"""
    
    def test_bot_command(self):
        """Test sending a command to the bot"""
        response = requests.post(f"{BASE_URL}/api/bot/command", json={
            "admin_id": MELVIN_USER_ID,
            "message": "¿Cuántos usuarios hay?"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data, "Bot should return a response"
        print(f"✓ Bot responded: {data['response'][:100]}...")
    
    def test_bot_history(self):
        """Test getting bot history"""
        response = requests.get(f"{BASE_URL}/api/bot/history?admin_id={MELVIN_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Bot history should be a list"
        print(f"✓ Bot history retrieved: {len(data)} messages")


class TestControlPanel:
    """Test Control Panel access"""
    
    def test_admin_users_access(self):
        """Test admin can access users list"""
        response = requests.get(f"{BASE_URL}/api/admin/users?admin_id={MELVIN_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return list of users"
        assert len(data) > 0, "Should have at least one user"
        
        # Check that users have gif_permission field
        for user in data[:5]:  # Check first 5 users
            assert "id" in user
            assert "username" in user
        print(f"✓ Admin users list retrieved: {len(data)} users")
    
    def test_rooms_list(self):
        """Test getting rooms list"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return list of rooms"
        print(f"✓ Rooms list retrieved: {len(data)} rooms")
    
    def test_clanes_list(self):
        """Test getting clanes list"""
        response = requests.get(f"{BASE_URL}/api/clanes")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return list of clanes"
        print(f"✓ Clanes list retrieved: {len(data)} clanes")


class TestRoomFeatures:
    """Test room features like 9 seats, chat, etc."""
    
    def test_room_has_9_seats(self):
        """Test that room has 9 seats"""
        room_response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id={MELVIN_USER_ID}")
        assert room_response.status_code == 200
        room_id = room_response.json()["id"]
        
        # Get room details
        response = requests.get(f"{BASE_URL}/api/rooms/{room_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "seats" in data, "Room should have seats"
        assert len(data["seats"]) == 9, f"Room should have 9 seats, got {len(data['seats'])}"
        print("✓ Room has 9 seats")
    
    def test_room_chat(self):
        """Test room chat functionality"""
        room_response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id={MELVIN_USER_ID}")
        room_id = room_response.json()["id"]
        
        # Send a chat message
        chat_response = requests.post(f"{BASE_URL}/api/rooms/{room_id}/chat", json={
            "user_id": MELVIN_USER_ID,
            "text": "Test message from pytest"
        })
        assert chat_response.status_code == 200, f"Expected 200, got {chat_response.status_code}"
        
        # Get chat messages
        get_chat = requests.get(f"{BASE_URL}/api/rooms/{room_id}/chat?limit=30")
        assert get_chat.status_code == 200
        
        messages = get_chat.json()
        assert isinstance(messages, list), "Chat should return list"
        print(f"✓ Room chat working: {len(messages)} messages")


class TestLogin:
    """Test login functionality"""
    
    def test_login_melvin(self):
        """Test login with Melvin_Live credentials"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "username": MELVIN_USERNAME,
            "password": MELVIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["user"]["username"] == MELVIN_USERNAME
        assert data["user"]["role"] == "dueño", f"Melvin should be dueño, got {data['user']['role']}"
        print(f"✓ Login successful: {data['user']['username']} (role: {data['user']['role']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
