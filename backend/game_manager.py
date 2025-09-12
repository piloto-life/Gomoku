from collections import deque
from typing import Dict, List, Optional

class GameManager:
    def __init__(self):
        self.current_players: List[Dict] = []
        self.waiting_queue: deque = deque()
        self.current_game_id: Optional[str] = None

    def add_player_to_queue(self, user: Dict):
        # Avoid adding duplicates
        if user not in self.waiting_queue:
            self.waiting_queue.append(user)

    def handle_game_end(self, winner: Dict, loser: Dict):
        self.add_player_to_queue(loser)
        
        if self.waiting_queue:
            next_player = self.waiting_queue.popleft()
            self.current_players = [winner, next_player]
        else:
            self.current_players = [winner]

game_manager = GameManager()