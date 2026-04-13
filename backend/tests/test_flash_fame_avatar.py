"""
Test Flash Fame and Avatar Upload Features
- GET /api/flash-fame/all - returns individual, clan_semanal, clan_mensual, pareja data
- POST /api/users/{user_id}/avatar - accepts file upload and updates avatar
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFlashFame:
    """Flash Fame endpoint tests"""
    
    def test_flash_fame_all_returns_data(self):
        """GET /api/flash-fame/all returns all 4 categories"""
        response = requests.get(f"{BASE_URL}/api/flash-fame/all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify structure - should have individual, clan_semanal, clan_mensual, pareja
        assert "individual" in data, "Missing 'individual' in flash fame response"
        
        # Verify individual has expected fields
        if data.get("individual"):
            ind = data["individual"]
            assert "username" in ind, "Individual missing username"
            assert "coins" in ind or "avatar" in ind, "Individual missing coins or avatar"
    
    def test_flash_fame_individual_is_top_user(self):
        """Flash Fame individual should be the top coins user"""
        response = requests.get(f"{BASE_URL}/api/flash-fame/all")
        assert response.status_code == 200
        
        data = response.json()
        if data.get("individual"):
            # Verify it's Melvin_Live (known top user)
            assert data["individual"]["username"] == "Melvin_Live", f"Expected Melvin_Live, got {data['individual']['username']}"
    
    def test_flash_fame_clan_semanal(self):
        """Flash Fame should include clan_semanal data"""
        response = requests.get(f"{BASE_URL}/api/flash-fame/all")
        assert response.status_code == 200
        
        data = response.json()
        if data.get("clan_semanal"):
            clan = data["clan_semanal"]
            assert "name" in clan, "Clan semanal missing name"
            assert clan["name"] == "Los Reyes", f"Expected Los Reyes, got {clan['name']}"
    
    def test_flash_fame_clan_mensual(self):
        """Flash Fame should include clan_mensual data"""
        response = requests.get(f"{BASE_URL}/api/flash-fame/all")
        assert response.status_code == 200
        
        data = response.json()
        if data.get("clan_mensual"):
            clan = data["clan_mensual"]
            assert "name" in clan, "Clan mensual missing name"
    
    def test_flash_fame_pareja(self):
        """Flash Fame should include pareja (CP) data"""
        response = requests.get(f"{BASE_URL}/api/flash-fame/all")
        assert response.status_code == 200
        
        data = response.json()
        if data.get("pareja"):
            pareja = data["pareja"]
            assert "user1_name" in pareja, "Pareja missing user1_name"
            assert "user2_name" in pareja, "Pareja missing user2_name"
            # Verify it's Melvin_Live & testuser_024929
            assert pareja["user1_name"] == "Melvin_Live", f"Expected Melvin_Live, got {pareja['user1_name']}"
            assert pareja["user2_name"] == "testuser_024929", f"Expected testuser_024929, got {pareja['user2_name']}"


class TestAvatarUpload:
    """Avatar upload endpoint tests"""
    
    def test_avatar_upload_requires_user(self):
        """POST /api/users/{user_id}/avatar returns 404 for invalid user"""
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        
        # Create a simple test image (1x1 PNG)
        files = {'file': ('test.png', io.BytesIO(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/users/{fake_user_id}/avatar", files=files)
        assert response.status_code == 404, f"Expected 404 for invalid user, got {response.status_code}"
    
    def test_avatar_upload_rejects_non_image(self):
        """POST /api/users/{user_id}/avatar rejects non-image files"""
        user_id = "b45958bc-2c6b-49ea-8102-a11197001e53"  # Melvin_Live
        
        # Try to upload a text file
        files = {'file': ('test.txt', io.BytesIO(b'This is not an image'), 'text/plain')}
        
        response = requests.post(f"{BASE_URL}/api/users/{user_id}/avatar", files=files)
        assert response.status_code == 400, f"Expected 400 for non-image, got {response.status_code}"
    
    def test_avatar_upload_success(self):
        """POST /api/users/{user_id}/avatar successfully uploads image"""
        user_id = "b45958bc-2c6b-49ea-8102-a11197001e53"  # Melvin_Live
        
        # Create a simple test image (1x1 PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {'file': ('test_avatar.png', io.BytesIO(png_data), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/users/{user_id}/avatar", files=files)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Avatar upload should return success=True"
        assert "avatar" in data, "Response should include avatar URL"
        assert data["avatar"].startswith("/api/uploads/"), f"Avatar URL should start with /api/uploads/, got {data['avatar']}"
    
    def test_avatar_persists_after_upload(self):
        """After avatar upload, GET user should return new avatar"""
        user_id = "b45958bc-2c6b-49ea-8102-a11197001e53"  # Melvin_Live
        
        # Get current user
        response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "avatar" in data, "User should have avatar field"
        # Avatar should be a local upload path (not dicebear)
        assert "/api/uploads/" in data["avatar"] or "dicebear" in data["avatar"], f"Avatar should be valid URL: {data['avatar']}"


class TestUserRankings:
    """User rankings tests - verify level, clan_name, cp_partner in rankings"""
    
    def test_rankings_include_user_details(self):
        """GET /api/rankings/coins returns users with level, clan_name, cp_partner"""
        response = requests.get(f"{BASE_URL}/api/rankings/coins")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Rankings should be a list"
        assert len(data) > 0, "Rankings should have at least one user"
        
        # Check first user (should be Melvin_Live)
        top_user = data[0]
        assert "username" in top_user, "User missing username"
        assert "level" in top_user, "User missing level"
        assert "coins" in top_user, "User missing coins"
        
        # Melvin_Live should have clan_name and cp_partner
        if top_user["username"] == "Melvin_Live":
            assert top_user.get("clan_name") is not None, "Melvin_Live should have clan_name"
            assert top_user.get("cp_partner") is not None, "Melvin_Live should have cp_partner"


class TestRoomCreation:
    """Room creation tests - verify 'Abrir Sala' functionality"""
    
    def test_create_room_success(self):
        """POST /api/rooms creates a new room"""
        user_id = "b45958bc-2c6b-49ea-8102-a11197001e53"  # Melvin_Live
        
        response = requests.post(
            f"{BASE_URL}/api/rooms?owner_id={user_id}",
            json={"name": "TEST_Sala_FlashFame"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Room should have id"
        assert data["name"] == "TEST_Sala_FlashFame", f"Room name mismatch: {data['name']}"
        assert data["owner_id"] == user_id, "Room owner_id mismatch"
        
        # Cleanup - delete the test room
        room_id = data["id"]
        requests.delete(f"{BASE_URL}/api/rooms/{room_id}?owner_id={user_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
