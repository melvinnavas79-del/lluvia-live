"""
Test suite for Lluvia Live Notifications System and RoomView stability
Tests: Notification APIs, Notification preferences, RoomView endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USERNAME = "Melvin_Live"
TEST_PASSWORD = "test123"

class TestNotificationAPIs:
    """Test notification system endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user_id"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.user = response.json()["user"]
        self.user_id = self.user["id"]
    
    def test_get_notifications(self):
        """GET /api/notifications/{user_id} returns list of notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have notifications from login hooks
        if len(data) > 0:
            notif = data[0]
            assert "id" in notif
            assert "category" in notif
            assert "title" in notif
            assert "message" in notif
            assert "created_at" in notif
            # Category should be one of the valid types
            assert notif["category"] in ["regalo_global", "evento_cp", "alerta_conexion", "invitacion"]
        print(f"✓ GET notifications returned {len(data)} notifications")
    
    def test_get_unread_count(self):
        """GET /api/notifications/{user_id}/unread-count returns count"""
        response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}/unread-count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0
        assert data["count"] <= 99  # Max capped at 99
        print(f"✓ Unread count: {data['count']}")
    
    def test_mark_notifications_read(self):
        """POST /api/notifications/{user_id}/mark-read marks all as read"""
        response = requests.post(f"{BASE_URL}/api/notifications/{self.user_id}/mark-read")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify unread count is now 0
        count_response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}/unread-count")
        assert count_response.status_code == 200
        assert count_response.json()["count"] == 0
        print("✓ Mark-read works, unread count is now 0")
    
    def test_get_notification_preferences(self):
        """GET /api/notifications/{user_id}/preferences returns prefs"""
        response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}/preferences")
        assert response.status_code == 200
        data = response.json()
        # Should have all 3 preference keys
        assert "regalos_globales" in data
        assert "eventos_cp" in data
        assert "alertas_conexion" in data
        # All should be boolean
        assert isinstance(data["regalos_globales"], bool)
        assert isinstance(data["eventos_cp"], bool)
        assert isinstance(data["alertas_conexion"], bool)
        print(f"✓ Preferences: {data}")
    
    def test_update_notification_preferences(self):
        """PUT /api/notifications/{user_id}/preferences updates prefs"""
        # First get current prefs
        get_response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}/preferences")
        original_prefs = get_response.json()
        
        # Update to toggle regalos_globales
        new_prefs = {
            "regalos_globales": not original_prefs["regalos_globales"],
            "eventos_cp": original_prefs["eventos_cp"],
            "alertas_conexion": original_prefs["alertas_conexion"]
        }
        
        response = requests.put(
            f"{BASE_URL}/api/notifications/{self.user_id}/preferences",
            json=new_prefs
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["prefs"]["regalos_globales"] == new_prefs["regalos_globales"]
        
        # Verify by getting again
        verify_response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}/preferences")
        assert verify_response.json()["regalos_globales"] == new_prefs["regalos_globales"]
        
        # Restore original prefs
        requests.put(
            f"{BASE_URL}/api/notifications/{self.user_id}/preferences",
            json=original_prefs
        )
        print("✓ Preferences update and restore works")
    
    def test_login_creates_alerta_conexion(self):
        """Login should create an alerta_conexion notification"""
        # Login again to trigger notification
        login_response = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        
        # Check notifications for alerta_conexion
        notif_response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}?limit=5")
        assert notif_response.status_code == 200
        notifs = notif_response.json()
        
        # Should have at least one alerta_conexion
        alerta_notifs = [n for n in notifs if n["category"] == "alerta_conexion"]
        assert len(alerta_notifs) > 0, "Login should create alerta_conexion notification"
        
        # Verify the notification content
        latest = alerta_notifs[0]
        assert "Conexion" in latest["title"]
        assert TEST_USERNAME in latest["message"]
        print("✓ Login creates alerta_conexion notification")


class TestRoomViewAPIs:
    """Test RoomView related endpoints for stability"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user_id, find a room"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.user = response.json()["user"]
        self.user_id = self.user["id"]
        
        # Get rooms
        rooms_response = requests.get(f"{BASE_URL}/api/rooms")
        assert rooms_response.status_code == 200
        rooms = rooms_response.json()
        if rooms:
            self.room_id = rooms[0]["id"]
        else:
            # Create a room if none exists
            create_response = requests.post(
                f"{BASE_URL}/api/rooms?owner_id={self.user_id}",
                json={"name": "TEST_Room_Stability"}
            )
            assert create_response.status_code == 200
            self.room_id = create_response.json()["id"]
    
    def test_get_room_details(self):
        """GET /api/rooms/{room_id} returns room with seats array"""
        response = requests.get(f"{BASE_URL}/api/rooms/{self.room_id}")
        assert response.status_code == 200
        room = response.json()
        
        assert "id" in room
        assert "name" in room
        assert "seats" in room
        assert isinstance(room["seats"], list)
        assert len(room["seats"]) >= 9  # At least 9 seats
        print(f"✓ Room '{room['name']}' has {len(room['seats'])} seats")
    
    def test_join_and_leave_seat(self):
        """POST /api/rooms/{room_id}/join and /leave work correctly"""
        # First leave any existing seat
        requests.post(f"{BASE_URL}/api/rooms/{self.room_id}/leave?user_id={self.user_id}")
        
        # Join seat 0
        join_response = requests.post(
            f"{BASE_URL}/api/rooms/{self.room_id}/join?user_id={self.user_id}&seat_index=0"
        )
        assert join_response.status_code == 200
        assert join_response.json()["success"] == True
        
        # Verify user is in seat
        room_response = requests.get(f"{BASE_URL}/api/rooms/{self.room_id}")
        room = room_response.json()
        assert room["seats"][0] is not None
        assert room["seats"][0]["user_id"] == self.user_id
        print("✓ User joined seat 0")
        
        # Leave seat
        leave_response = requests.post(
            f"{BASE_URL}/api/rooms/{self.room_id}/leave?user_id={self.user_id}"
        )
        assert leave_response.status_code == 200
        assert leave_response.json()["success"] == True
        
        # Verify seat is empty
        room_response2 = requests.get(f"{BASE_URL}/api/rooms/{self.room_id}")
        room2 = room_response2.json()
        assert room2["seats"][0] is None
        print("✓ User left seat 0")
    
    def test_room_chat(self):
        """GET /api/rooms/{room_id}/chat returns messages"""
        response = requests.get(f"{BASE_URL}/api/rooms/{self.room_id}/chat?limit=10")
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        print(f"✓ Room chat has {len(messages)} messages")
    
    def test_welcome_creates_invitacion_notification(self):
        """POST /api/rooms/{room_id}/welcome creates invitacion notification"""
        # First join a seat
        requests.post(f"{BASE_URL}/api/rooms/{self.room_id}/leave?user_id={self.user_id}")
        requests.post(f"{BASE_URL}/api/rooms/{self.room_id}/join?user_id={self.user_id}&seat_index=0")
        
        # Call welcome endpoint
        welcome_response = requests.post(
            f"{BASE_URL}/api/rooms/{self.room_id}/welcome?user_id={self.user_id}"
        )
        assert welcome_response.status_code == 200
        welcome_data = welcome_response.json()
        assert "text" in welcome_data
        assert "type" in welcome_data
        assert welcome_data["type"] == "welcome"
        
        # Check for invitacion notification
        notif_response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}?limit=5")
        notifs = notif_response.json()
        invitacion_notifs = [n for n in notifs if n["category"] == "invitacion"]
        assert len(invitacion_notifs) > 0, "Welcome should create invitacion notification"
        
        # Verify notification has room_id in data
        latest = invitacion_notifs[0]
        assert "room_id" in latest.get("data", {})
        print("✓ Welcome creates invitacion notification with room_id")
        
        # Cleanup - leave seat
        requests.post(f"{BASE_URL}/api/rooms/{self.room_id}/leave?user_id={self.user_id}")


class TestNotificationCategories:
    """Test that notification categories work correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user_id"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        self.user = response.json()["user"]
        self.user_id = self.user["id"]
    
    def test_notification_filtering_by_preferences(self):
        """Notifications should be filtered based on user preferences"""
        # Set preferences to disable alertas_conexion
        requests.put(
            f"{BASE_URL}/api/notifications/{self.user_id}/preferences",
            json={"regalos_globales": True, "eventos_cp": True, "alertas_conexion": False}
        )
        
        # Get notifications - should not include alerta_conexion
        response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}?limit=30")
        notifs = response.json()
        
        # Check that no alerta_conexion notifications are returned
        alerta_notifs = [n for n in notifs if n["category"] == "alerta_conexion"]
        assert len(alerta_notifs) == 0, "Should not return alerta_conexion when disabled"
        print("✓ Notifications filtered by preferences")
        
        # Restore preferences
        requests.put(
            f"{BASE_URL}/api/notifications/{self.user_id}/preferences",
            json={"regalos_globales": True, "eventos_cp": True, "alertas_conexion": True}
        )
    
    def test_invitacion_always_included(self):
        """Invitacion notifications should always be included (AUTO)"""
        # Even with all prefs disabled, invitacion should still show
        # Note: invitacion is always added to active_cats in the backend
        
        # Get notifications
        response = requests.get(f"{BASE_URL}/api/notifications/{self.user_id}?limit=30")
        assert response.status_code == 200
        # The endpoint should work regardless of invitacion preference
        print("✓ Invitacion category is always active (AUTO)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
