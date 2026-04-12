import requests
import sys
from datetime import datetime
import json

class LluviaLiveAPITester:
    def __init__(self, base_url="https://codigo-necesario.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_room_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response text: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        username = f"testuser_{timestamp}"
        password = "TestPass123!"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "register",
            200,
            data={"username": username, "password": password}
        )
        
        if success and response.get('success') and response.get('user'):
            self.test_user_id = response['user']['id']
            print(f"✅ User created with ID: {self.test_user_id}")
            return username, password
        return None, None

    def test_user_login(self, username, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "login",
            200,
            data={"username": username, "password": password}
        )
        
        if success and response.get('success') and response.get('user'):
            print(f"✅ Login successful for user: {username}")
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "login",
            401,
            data={"username": "nonexistent", "password": "wrongpass"}
        )
        return success

    def test_get_user(self):
        """Test getting user by ID"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Get User",
            "GET",
            f"users/{self.test_user_id}",
            200
        )
        
        if success and response.get('username'):
            print(f"✅ Retrieved user: {response['username']}")
            return True
        return False

    def test_update_user(self):
        """Test updating user"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Update User",
            "PUT",
            f"users/{self.test_user_id}",
            200,
            data={"coins": 2000, "level": 2}
        )
        
        if success and response.get('coins') == 2000 and response.get('level') == 2:
            print(f"✅ User updated successfully")
            return True
        return False

    def test_create_room(self):
        """Test creating a room"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        room_name = f"Test Room {datetime.now().strftime('%H%M%S')}"
        success, response = self.run_test(
            "Create Room",
            "POST",
            "rooms",
            200,
            data={"name": room_name},
            params={"owner_id": self.test_user_id}
        )
        
        if success and response.get('id'):
            self.test_room_id = response['id']
            print(f"✅ Room created with ID: {self.test_room_id}")
            return True
        return False

    def test_get_rooms(self):
        """Test getting all rooms"""
        success, response = self.run_test(
            "Get Rooms",
            "GET",
            "rooms",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} rooms")
            return True
        return False

    def test_get_room(self):
        """Test getting specific room"""
        if not self.test_room_id:
            print("❌ No test room ID available")
            return False
            
        success, response = self.run_test(
            "Get Room",
            "GET",
            f"rooms/{self.test_room_id}",
            200
        )
        
        if success and response.get('id') == self.test_room_id:
            print(f"✅ Retrieved room: {response['name']}")
            return True
        return False

    def test_join_room(self):
        """Test joining a room seat"""
        if not self.test_room_id or not self.test_user_id:
            print("❌ No test room or user ID available")
            return False
            
        success, response = self.run_test(
            "Join Room Seat",
            "POST",
            f"rooms/{self.test_room_id}/join",
            200,
            params={"user_id": self.test_user_id, "seat_index": 0}
        )
        
        if success and response.get('success'):
            print(f"✅ Joined seat {response.get('seat_index', 0)}")
            return True
        return False

    def test_leave_room(self):
        """Test leaving a room"""
        if not self.test_room_id or not self.test_user_id:
            print("❌ No test room or user ID available")
            return False
            
        success, response = self.run_test(
            "Leave Room",
            "POST",
            f"rooms/{self.test_room_id}/leave",
            200,
            params={"user_id": self.test_user_id}
        )
        
        if success and response.get('success'):
            print(f"✅ Left room successfully")
            return True
        return False

    def test_rankings(self):
        """Test ranking endpoints"""
        coins_success, coins_response = self.run_test(
            "Coins Ranking",
            "GET",
            "rankings/coins",
            200
        )
        
        level_success, level_response = self.run_test(
            "Level Ranking",
            "GET",
            "rankings/level",
            200
        )
        
        return coins_success and level_success

    def test_delete_room(self):
        """Test deleting a room"""
        if not self.test_room_id or not self.test_user_id:
            print("❌ No test room or user ID available")
            return False
            
        success, response = self.run_test(
            "Delete Room",
            "DELETE",
            f"rooms/{self.test_room_id}",
            200,
            params={"owner_id": self.test_user_id}
        )
        
        if success and response.get('success'):
            print(f"✅ Room deleted successfully")
            return True
        return False

    def test_game_ruleta(self):
        """Test Ruleta game"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Game: Ruleta",
            "POST",
            "games/ruleta",
            200,
            data={"user_id": self.test_user_id, "bet_amount": 500}
        )
        
        if success and 'result' in response and 'new_balance' in response:
            print(f"✅ Ruleta result: {response['result']}, net: {response.get('net', 0)}")
            return True
        return False

    def test_game_dados(self):
        """Test Dados game"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Game: Dados",
            "POST",
            "games/dados",
            200,
            data={"user_id": self.test_user_id, "bet_amount": 500}
        )
        
        if success and 'dice1' in response and 'dice2' in response and 'new_balance' in response:
            print(f"✅ Dados result: {response['dice1']} + {response['dice2']} = {response['total']}, result: {response['result']}")
            return True
        return False

    def test_game_rps(self):
        """Test Piedra Papel Tijera game"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Game: Piedra Papel Tijera",
            "POST",
            "games/piedra-papel-tijera",
            200,
            data={"user_id": self.test_user_id, "bet_amount": 500, "choice": "piedra"}
        )
        
        if success and 'player_choice' in response and 'computer_choice' in response and 'new_balance' in response:
            print(f"✅ RPS result: {response['player_choice']} vs {response['computer_choice']}, result: {response['result']}")
            return True
        return False

    def test_game_trivia_question(self):
        """Test getting trivia question"""
        success, response = self.run_test(
            "Game: Trivia Question",
            "GET",
            "games/trivia/question",
            200
        )
        
        if success and 'question' in response and 'options' in response:
            print(f"✅ Trivia question loaded: {response['question'][:50]}...")
            return True
        return False

    def test_game_trivia(self):
        """Test Trivia game"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Game: Trivia",
            "POST",
            "games/trivia",
            200,
            data={"user_id": self.test_user_id, "bet_amount": 500, "answer_index": 1}
        )
        
        if success and 'correct' in response and 'new_balance' in response:
            print(f"✅ Trivia result: {'Correct' if response['correct'] else 'Incorrect'}, answer: {response.get('correct_answer', 'N/A')}")
            return True
        return False

    def test_game_carta_mayor(self):
        """Test Carta Mayor game"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Game: Carta Mayor",
            "POST",
            "games/carta-mayor",
            200,
            data={"user_id": self.test_user_id, "bet_amount": 500, "guess": "mayor"}
        )
        
        if success and 'card1' in response and 'card2' in response and 'new_balance' in response:
            print(f"✅ Carta Mayor result: {response['card1']} → {response['card2']}, guess: {response['guess']}, result: {response['result']}")
            return True
        return False

    def test_games_insufficient_coins(self):
        """Test games with insufficient coins"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        # Try to bet more than user has
        success, response = self.run_test(
            "Game: Insufficient Coins",
            "POST",
            "games/ruleta",
            400,
            data={"user_id": self.test_user_id, "bet_amount": 999999}
        )
        
        return success  # Should return 400 for insufficient coins

    def test_admin_set_admin(self):
        """Test setting admin with correct key"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Admin: Set Admin",
            "POST",
            "admin/set-admin",
            200,
            params={"user_id": self.test_user_id, "admin_key": "lluvia_admin_2024"}
        )
        
        if success and response.get('is_admin'):
            print(f"✅ User is now admin with VIP status: {response.get('vip_status')}")
            return True
        return False

    def test_admin_set_admin_invalid_key(self):
        """Test setting admin with invalid key"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Admin: Invalid Key",
            "POST",
            "admin/set-admin",
            403,
            params={"user_id": self.test_user_id, "admin_key": "wrong_key"}
        )
        
        return success  # Should return 403 for invalid key

    def test_admin_get_users(self):
        """Test getting users list as admin"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Admin: Get Users",
            "GET",
            "admin/users",
            200,
            params={"admin_id": self.test_user_id}
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} users as admin")
            return True
        return False

    def test_admin_update_user(self):
        """Test updating user as admin"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Admin: Update User",
            "PUT",
            f"admin/users/{self.test_user_id}",
            200,
            data={"coins": 5000},
            params={"admin_id": self.test_user_id}
        )
        
        if success and response.get('coins') == 5000:
            print(f"✅ Admin updated user coins to 5000")
            return True
        return False

    def test_ghost_mode_admin_only(self):
        """Test ghost mode toggle (admin only)"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Ghost Mode: Toggle",
            "POST",
            f"users/{self.test_user_id}/ghost-mode",
            200
        )
        
        if success and 'ghost_mode' in response:
            print(f"✅ Ghost mode toggled to: {response['ghost_mode']}")
            return True
        return False

    def test_create_reel(self):
        """Test creating a reel"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Reels: Create Reel",
            "POST",
            "reels",
            200,
            data={
                "user_id": self.test_user_id,
                "title": "Test Reel",
                "description": "This is a test reel",
                "video_url": ""
            }
        )
        
        if success and response.get('id'):
            self.test_reel_id = response['id']
            print(f"✅ Reel created with ID: {self.test_reel_id}")
            return True
        return False

    def test_get_reels(self):
        """Test getting reels list"""
        success, response = self.run_test(
            "Reels: Get Reels",
            "GET",
            "reels",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} reels")
            return True
        return False

    def test_like_reel(self):
        """Test liking a reel"""
        if not self.test_user_id or not hasattr(self, 'test_reel_id'):
            print("❌ No test user or reel ID available")
            return False
            
        success, response = self.run_test(
            "Reels: Like Reel",
            "POST",
            f"reels/{self.test_reel_id}/like",
            200,
            params={"user_id": self.test_user_id}
        )
        
        if success and response.get('success'):
            print(f"✅ Reel liked, total likes: {response.get('likes', 0)}")
            return True
        return False

    def test_create_photo(self):
        """Test creating a photo"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Photos: Create Photo",
            "POST",
            "photos",
            200,
            data={
                "user_id": self.test_user_id,
                "title": "Test Photo",
                "image_url": "https://picsum.photos/400/400",
                "description": "This is a test photo"
            }
        )
        
        if success and response.get('id'):
            self.test_photo_id = response['id']
            print(f"✅ Photo created with ID: {self.test_photo_id}")
            return True
        return False

    def test_get_photos(self):
        """Test getting photos list"""
        success, response = self.run_test(
            "Photos: Get Photos",
            "GET",
            "photos",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} photos")
            return True
        return False

    def test_like_photo(self):
        """Test liking a photo"""
        if not self.test_user_id or not hasattr(self, 'test_photo_id'):
            print("❌ No test user or photo ID available")
            return False
            
        success, response = self.run_test(
            "Photos: Like Photo",
            "POST",
            f"photos/{self.test_photo_id}/like",
            200,
            params={"user_id": self.test_user_id}
        )
        
        if success and response.get('success'):
            print(f"✅ Photo liked, total likes: {response.get('likes', 0)}")
            return True
        return False

def main():
    print("🌧️ Starting Lluvia Live API Tests...")
    tester = LluviaLiveAPITester()
    
    # Test user registration and login flow
    username, password = tester.test_user_registration()
    if not username:
        print("❌ Registration failed, stopping tests")
        return 1
    
    if not tester.test_user_login(username, password):
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test invalid login
    tester.test_invalid_login()
    
    # Test user operations
    tester.test_get_user()
    tester.test_update_user()
    
    # Test room operations
    if not tester.test_create_room():
        print("❌ Room creation failed, skipping room tests")
    else:
        tester.test_get_rooms()
        tester.test_get_room()
        tester.test_join_room()
        tester.test_leave_room()
        tester.test_delete_room()
    
    # Test rankings
    tester.test_rankings()
    
    # Test games
    print(f"\n🎮 Testing Games...")
    tester.test_game_ruleta()
    tester.test_game_dados()
    tester.test_game_rps()
    tester.test_game_trivia_question()
    tester.test_game_trivia()
    tester.test_game_carta_mayor()
    tester.test_games_insufficient_coins()
    
    # Test NEW features: Admin, Ghost Mode, Reels, Photos
    print(f"\n👑 Testing Admin Features...")
    tester.test_admin_set_admin_invalid_key()  # Test invalid key first
    tester.test_admin_set_admin()  # Make user admin
    tester.test_admin_get_users()
    tester.test_admin_update_user()
    
    print(f"\n👻 Testing Ghost Mode...")
    tester.test_ghost_mode_admin_only()
    
    print(f"\n🎬 Testing Reels...")
    tester.test_create_reel()
    tester.test_get_reels()
    tester.test_like_reel()
    
    print(f"\n📸 Testing Photos...")
    tester.test_create_photo()
    tester.test_get_photos()
    tester.test_like_photo()
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())