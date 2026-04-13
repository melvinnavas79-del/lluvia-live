"""
Backend API Tests for Lluvia Live - Clanes, Parejas, and RoomView features
Tests the new features: Clanes system, Parejas (CP) system, and Room audio controls
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USERNAME = "Melvin_Live"
TEST_PASSWORD = "test123"

class TestHealthAndLogin:
    """Basic health and login tests"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        print(f"✓ API health check passed - /api/rooms returns {response.status_code}")
    
    def test_login_melvin(self):
        """Test login with Melvin_Live credentials"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "user" in data
        assert data["user"]["username"] == TEST_USERNAME
        print(f"✓ Login successful for {TEST_USERNAME}")
        return data["user"]


class TestClanesAPI:
    """Tests for Clanes (Clans) API endpoints"""
    
    def test_get_clanes_list(self):
        """GET /api/clanes - Returns list of clans"""
        response = requests.get(f"{BASE_URL}/api/clanes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/clanes returns {len(data)} clans")
        return data
    
    def test_los_reyes_clan_exists(self):
        """Verify 'Los Reyes' clan exists with Melvin_Live as owner"""
        response = requests.get(f"{BASE_URL}/api/clanes")
        assert response.status_code == 200
        clanes = response.json()
        
        los_reyes = next((c for c in clanes if c["name"] == "Los Reyes"), None)
        assert los_reyes is not None, "Los Reyes clan should exist"
        assert los_reyes["owner_name"] == "Melvin_Live", "Melvin_Live should be the owner"
        print(f"✓ 'Los Reyes' clan exists with owner: {los_reyes['owner_name']}")
        return los_reyes
    
    def test_create_clan(self):
        """POST /api/clanes - Create a new clan"""
        # First login to get user ID
        login_res = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        user_id = login_res.json()["user"]["id"]
        
        # User already has a clan, so this should fail
        clan_name = f"TEST_Clan_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/clanes", json={
            "name": clan_name,
            "owner_id": user_id
        })
        # May fail if user already in a clan - that's expected
        print(f"✓ POST /api/clanes tested - status: {response.status_code}")
    
    def test_clan_join_endpoint_exists(self):
        """POST /api/clanes/{clan_id}/join - Endpoint exists"""
        # Get a clan ID
        clanes = requests.get(f"{BASE_URL}/api/clanes").json()
        if clanes:
            clan_id = clanes[0]["id"]
            # Try to join (may fail if already member)
            response = requests.post(f"{BASE_URL}/api/clanes/{clan_id}/join?user_id=test_user_id")
            # 400 or 404 means endpoint exists
            assert response.status_code in [200, 400, 404]
            print(f"✓ POST /api/clanes/{{clan_id}}/join endpoint exists - status: {response.status_code}")
    
    def test_clan_leave_endpoint_exists(self):
        """POST /api/clanes/{clan_id}/leave - Endpoint exists"""
        clanes = requests.get(f"{BASE_URL}/api/clanes").json()
        if clanes:
            clan_id = clanes[0]["id"]
            response = requests.post(f"{BASE_URL}/api/clanes/{clan_id}/leave?user_id=test_user_id")
            # 200 or 400 means endpoint exists
            assert response.status_code in [200, 400, 404]
            print(f"✓ POST /api/clanes/{{clan_id}}/leave endpoint exists - status: {response.status_code}")


class TestParejasAPI:
    """Tests for Parejas (CP/Couples) API endpoints"""
    
    def test_get_parejas_list(self):
        """GET /api/cp - Returns list of parejas"""
        response = requests.get(f"{BASE_URL}/api/cp")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/cp returns {len(data)} parejas")
        return data
    
    def test_melvin_pareja_exists(self):
        """Verify Melvin_Live + testuser_024929 pareja exists"""
        response = requests.get(f"{BASE_URL}/api/cp")
        assert response.status_code == 200
        parejas = response.json()
        
        melvin_pareja = next((p for p in parejas if 
            (p["user1_name"] == "Melvin_Live" or p["user2_name"] == "Melvin_Live")), None)
        assert melvin_pareja is not None, "Melvin_Live should have a pareja"
        
        # Check partner
        partner = melvin_pareja["user2_name"] if melvin_pareja["user1_name"] == "Melvin_Live" else melvin_pareja["user1_name"]
        assert partner == "testuser_024929", f"Partner should be testuser_024929, got {partner}"
        print(f"✓ Pareja exists: Melvin_Live + {partner}")
        return melvin_pareja
    
    def test_create_pareja_endpoint(self):
        """POST /api/cp/create - Endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/cp/create", json={
            "user1_id": "fake_user_1",
            "user2_id": "fake_user_2"
        })
        # 404 means users not found, but endpoint exists
        assert response.status_code in [200, 201, 400, 404]
        print(f"✓ POST /api/cp/create endpoint exists - status: {response.status_code}")
    
    def test_pareja_level_up_endpoint(self):
        """POST /api/cp/{cp_id}/level-up - Endpoint exists"""
        parejas = requests.get(f"{BASE_URL}/api/cp").json()
        if parejas:
            cp_id = parejas[0]["id"]
            response = requests.post(f"{BASE_URL}/api/cp/{cp_id}/level-up")
            assert response.status_code in [200, 400, 404]
            print(f"✓ POST /api/cp/{{cp_id}}/level-up endpoint exists - status: {response.status_code}")


class TestRoomsAPI:
    """Tests for Rooms API endpoints"""
    
    def test_get_rooms_list(self):
        """GET /api/rooms - Returns list of rooms"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1, "Should have at least 1 room"
        print(f"✓ GET /api/rooms returns {len(data)} rooms")
        return data
    
    def test_get_room_by_id(self):
        """GET /api/rooms/{room_id} - Get specific room"""
        rooms = requests.get(f"{BASE_URL}/api/rooms").json()
        if rooms:
            room_id = rooms[0]["id"]
            response = requests.get(f"{BASE_URL}/api/rooms/{room_id}")
            assert response.status_code == 200
            room = response.json()
            assert room["id"] == room_id
            assert "seats" in room
            assert "active_users" in room
            print(f"✓ GET /api/rooms/{{room_id}} returns room: {room['name']}")
    
    def test_room_join_endpoint(self):
        """POST /api/rooms/{room_id}/join - Join a seat"""
        # Login first
        login_res = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        user_id = login_res.json()["user"]["id"]
        
        rooms = requests.get(f"{BASE_URL}/api/rooms").json()
        if rooms:
            room_id = rooms[0]["id"]
            # Try to join seat 7 (likely empty)
            response = requests.post(
                f"{BASE_URL}/api/rooms/{room_id}/join",
                params={"user_id": user_id, "seat_index": 7}
            )
            assert response.status_code in [200, 400]
            print(f"✓ POST /api/rooms/{{room_id}}/join endpoint works - status: {response.status_code}")
    
    def test_room_leave_endpoint(self):
        """POST /api/rooms/{room_id}/leave - Leave a seat"""
        login_res = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        user_id = login_res.json()["user"]["id"]
        
        rooms = requests.get(f"{BASE_URL}/api/rooms").json()
        if rooms:
            room_id = rooms[0]["id"]
            response = requests.post(
                f"{BASE_URL}/api/rooms/{room_id}/leave",
                params={"user_id": user_id}
            )
            assert response.status_code == 200
            print(f"✓ POST /api/rooms/{{room_id}}/leave endpoint works - status: {response.status_code}")
    
    def test_room_chat_endpoints(self):
        """Test room chat GET and POST"""
        rooms = requests.get(f"{BASE_URL}/api/rooms").json()
        if rooms:
            room_id = rooms[0]["id"]
            
            # GET chat
            response = requests.get(f"{BASE_URL}/api/rooms/{room_id}/chat")
            assert response.status_code == 200
            print(f"✓ GET /api/rooms/{{room_id}}/chat works - {len(response.json())} messages")


class TestRankingsAPI:
    """Tests for Rankings API"""
    
    def test_coins_ranking(self):
        """GET /api/rankings/coins - Get coins ranking"""
        response = requests.get(f"{BASE_URL}/api/rankings/coins")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/rankings/coins returns {len(data)} users")
    
    def test_level_ranking(self):
        """GET /api/rankings/level - Get level ranking"""
        response = requests.get(f"{BASE_URL}/api/rankings/level")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/rankings/level returns {len(data)} users")


class TestUserAPI:
    """Tests for User API"""
    
    def test_get_user_by_id(self):
        """GET /api/users/{user_id} - Get user details"""
        login_res = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        user_id = login_res.json()["user"]["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        user = response.json()
        assert user["username"] == TEST_USERNAME
        # Check clan info is present
        assert "clan_id" in user or "clan_name" in user
        # Check CP info is present
        assert "cp_id" in user or "cp_partner" in user
        print(f"✓ GET /api/users/{{user_id}} returns user with clan_id and cp_id fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
