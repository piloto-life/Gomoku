from collections import deque
from typing import Dict, List, Optional
import uuid

class GameManager:
    def __init__(self):
        self.current_players: List[Dict] = []
        self.waiting_queue: deque = deque()
        self.current_game_id: Optional[str] = None

    def add_player_to_queue(self, user: Dict):
        # Avoid adding duplicates
        if user not in self.waiting_queue:
            self.waiting_queue.append(user)

    def remove_player_from_queue(self, user: Dict):
        if user in self.waiting_queue:
            self.waiting_queue.remove(user)

    def start_new_game(self) -> Optional[Dict]:
        if len(self.waiting_queue) >= 2:
            player1 = self.waiting_queue.popleft()
            player2 = self.waiting_queue.popleft()
            
            game_id = str(uuid.uuid4())
            
            self.current_players.extend([player1, player2])
            
            return {
                "game_id": game_id,
                "players": [player1, player2]
            }
        return None

    def handle_game_end(self, winner: Dict, loser: Dict):
        # Remove players from the current game
        self.current_players = [p for p in self.current_players if p['id'] not in [winner['id'], loser['id']]]
        
        # Add the loser back to the queue
        self.add_player_to_queue(loser)
        
        # The winner can decide to join the queue again from the client-side
        # Or you can automatically add them back like this:
        # self.add_player_to_queue(winner)
        
        # Check if a new game can be started
        return self.start_new_game()

game_manager = GameManager()