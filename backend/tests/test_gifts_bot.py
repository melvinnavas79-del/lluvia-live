"""
Test suite for Lluvia Live new features:
- Gift system (8 gifts: rosa, corazon, diamante, corona, dragon, castillo, lluvia_oro, mega_crown)
- Bot floating (only for dueño role)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MELVIN_ID = "b45958bc-2c6b-49ea-8102-a11197001e53"
MELVIN_USERNAME = "Melvin_Live"
MELVIN_PASSWORD = "test123"


class TestGiftsAPI:
    """Test gift system endpoints"""
    
    def test_get_all_gifts(self):
        """GET /api/gifts should return all 8 gift types"""
        response = requests.get(f"{BASE_URL}/api/gifts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        gifts = response.json()
        expected_gifts = ["rosa", "corazon", "diamante", "corona", "dragon", "castillo", "lluvia_oro", "mega_crown"]
        
        for gift_type in expected_gifts:
            assert gift_type in gifts, f"Gift type '{gift_type}' not found in response"
            assert "name" in gifts[gift_type], f"Gift '{gift_type}' missing 'name'"
            assert "emoji" in gifts[gift_type], f"Gift '{gift_type}' missing 'emoji'"
            assert "cost" in gifts[gift_type], f"Gift '{gift_type}' missing 'cost'"
            assert "value" in gifts[gift_type], f"Gift '{gift_type}' missing 'value'"
        
        print(f"SUCCESS: All 8 gifts found with correct structure")
    
    def test_gift_prices(self):
        """Verify gift prices match expected values"""
        response = requests.get(f"{BASE_URL}/api/gifts")
        assert response.status_code == 200
        
        gifts = response.json()
        expected_prices = {
            "rosa": 100,
            "corazon": 500,
            "diamante": 5000,
            "corona": 10000,
            "dragon": 50000,
            "castillo": 100000,
            "lluvia_oro": 500000,
            "mega_crown": 1000000
        }
        
        for gift_type, expected_cost in expected_prices.items():
            actual_cost = gifts[gift_type]["cost"]
            assert actual_cost == expected_cost, f"Gift '{gift_type}' cost mismatch: expected {expected_cost}, got {actual_cost}"
        
        print(f"SUCCESS: All gift prices match expected values")
    
    def test_send_gift_invalid_gift_type(self):
        """POST /api/gifts/send with invalid gift type should return 400"""
        response = requests.post(f"{BASE_URL}/api/gifts/send", json={
            "sender_id": MELVIN_ID,
            "receiver_id": MELVIN_ID,
            "gift_type": "invalid_gift",
            "room_id": ""
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"SUCCESS: Invalid gift type returns 400")
    
    def test_send_gift_invalid_sender(self):
        """POST /api/gifts/send with invalid sender should return 404"""
        response = requests.post(f"{BASE_URL}/api/gifts/send", json={
            "sender_id": "invalid-sender-id",
            "receiver_id": MELVIN_ID,
            "gift_type": "rosa",
            "room_id": ""
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"SUCCESS: Invalid sender returns 404")
    
    def test_send_gift_invalid_receiver(self):
        """POST /api/gifts/send with invalid receiver should return 404"""
        response = requests.post(f"{BASE_URL}/api/gifts/send", json={
            "sender_id": MELVIN_ID,
            "receiver_id": "invalid-receiver-id",
            "gift_type": "rosa",
            "room_id": ""
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"SUCCESS: Invalid receiver returns 404")


class TestBotAPI:
    """Test bot command endpoints (only for dueño)"""
    
    def test_bot_command_success(self):
        """POST /api/bot/command should work for dueño"""
        response = requests.post(f"{BASE_URL}/api/bot/command", json={
            "admin_id": MELVIN_ID,
            "message": "¿Cuántos usuarios hay?"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "response" in data, "Response missing 'response' field"
        print(f"SUCCESS: Bot command returned response: {data['response'][:50]}...")
    
    def test_bot_command_non_dueno(self):
        """POST /api/bot/command should fail for non-dueño"""
        response = requests.post(f"{BASE_URL}/api/bot/command", json={
            "admin_id": "invalid-admin-id",
            "message": "test"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"SUCCESS: Non-dueño bot command returns 403")
    
    def test_bot_history_success(self):
        """GET /api/bot/history should work for dueño"""
        response = requests.get(f"{BASE_URL}/api/bot/history?admin_id={MELVIN_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Bot history returned {len(data)} messages")
    
    def test_bot_history_non_dueno(self):
        """GET /api/bot/history should fail for non-dueño"""
        response = requests.get(f"{BASE_URL}/api/bot/history?admin_id=invalid-admin-id")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"SUCCESS: Non-dueño bot history returns 403")


class TestUserRoleCheck:
    """Test user role verification for bot access"""
    
    def test_melvin_is_dueno(self):
        """Verify Melvin_Live has dueño role"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "username": MELVIN_USERNAME,
            "password": MELVIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        
        data = response.json()
        assert data["success"] == True, "Login not successful"
        assert data["user"]["role"] == "dueño", f"Expected role 'dueño', got '{data['user']['role']}'"
        print(f"SUCCESS: Melvin_Live has dueño role")
    
    def test_regular_user_not_dueno(self):
        """Create a test user and verify they don't have dueño role"""
        import uuid
        test_username = f"test_role_{uuid.uuid4().hex[:8]}"
        
        # Register new user
        response = requests.post(f"{BASE_URL}/api/register", json={
            "username": test_username,
            "password": "test123"
        })
        
        if response.status_code == 200:
            data = response.json()
            assert data["user"]["role"] == "usuario", f"New user should have 'usuario' role, got '{data['user']['role']}'"
            print(f"SUCCESS: New user has 'usuario' role (not dueño)")
        else:
            print(f"INFO: Could not create test user (may already exist)")


class TestGiftSendFlow:
    """Test complete gift sending flow"""
    
    def test_send_rosa_gift(self):
        """Test sending a rosa gift (cheapest)"""
        # First get a test receiver
        response = requests.get(f"{BASE_URL}/api/admin/users?admin_id={MELVIN_ID}")
        if response.status_code != 200:
            pytest.skip("Could not get users list")
        
        users = response.json()
        # Find a user that's not Melvin
        receiver = None
        for u in users:
            if u["id"] != MELVIN_ID:
                receiver = u
                break
        
        if not receiver:
            pytest.skip("No other users to send gift to")
        
        # Get sender's initial balance
        sender_response = requests.get(f"{BASE_URL}/api/users/{MELVIN_ID}")
        initial_balance = sender_response.json()["coins"]
        
        # Send gift
        response = requests.post(f"{BASE_URL}/api/gifts/send", json={
            "sender_id": MELVIN_ID,
            "receiver_id": receiver["id"],
            "gift_type": "rosa",
            "room_id": ""
        })
        
        assert response.status_code == 200, f"Gift send failed: {response.status_code}"
        data = response.json()
        
        assert data["success"] == True, "Gift send not successful"
        assert "gift" in data, "Response missing 'gift' field"
        assert "new_balance" in data, "Response missing 'new_balance' field"
        
        # Verify balance deducted (rosa costs 100)
        expected_balance = initial_balance - 100
        assert data["new_balance"] == expected_balance, f"Balance mismatch: expected {expected_balance}, got {data['new_balance']}"
        
        print(f"SUCCESS: Rosa gift sent to {receiver['username']}, balance updated correctly")


class TestRoomGiftIntegration:
    """Test gift system in room context"""
    
    def test_gift_appears_in_room_chat(self):
        """Verify gift message appears in room chat"""
        # Get Melvin's room
        response = requests.post(f"{BASE_URL}/api/rooms/my-room?user_id={MELVIN_ID}")
        if response.status_code != 200:
            pytest.skip("Could not get Melvin's room")
        
        room = response.json()
        room_id = room["id"]
        
        # Get a receiver
        users_response = requests.get(f"{BASE_URL}/api/admin/users?admin_id={MELVIN_ID}")
        if users_response.status_code != 200:
            pytest.skip("Could not get users list")
        
        users = users_response.json()
        receiver = None
        for u in users:
            if u["id"] != MELVIN_ID:
                receiver = u
                break
        
        if not receiver:
            pytest.skip("No other users to send gift to")
        
        # Send gift in room
        response = requests.post(f"{BASE_URL}/api/gifts/send", json={
            "sender_id": MELVIN_ID,
            "receiver_id": receiver["id"],
            "gift_type": "corazon",
            "room_id": room_id
        })
        
        assert response.status_code == 200, f"Gift send failed: {response.status_code}"
        
        # Check room chat for gift message
        chat_response = requests.get(f"{BASE_URL}/api/rooms/{room_id}/chat?limit=10")
        assert chat_response.status_code == 200
        
        messages = chat_response.json()
        gift_messages = [m for m in messages if m.get("type") == "gift"]
        
        assert len(gift_messages) > 0, "No gift messages found in room chat"
        print(f"SUCCESS: Gift message appears in room chat")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
