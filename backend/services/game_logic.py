from typing import List, Optional
from models.game import Position, PieceColor

class GameLogic:
    def __init__(self):
        self.board_size = 19
        
    def is_valid_move(self, board: List[List[Optional[str]]], position: Position) -> bool:
        """Check if a move is valid"""
        if position.row < 0 or position.row >= self.board_size:
            return False
        if position.col < 0 or position.col >= self.board_size:
            return False
        
        # Check if position is empty
        return board[position.row][position.col] is None
    
    def make_move(self, board: List[List[Optional[str]]], position: Position, piece: PieceColor) -> bool:
        """Attempt to make a move on the board in-place.

        Returns True if the move was applied, False otherwise.
        This mutating, boolean-returning behavior matches the expectations
        from the test-suite which assumes in-place updates.
        """
        if not self.is_valid_move(board, position):
            return False

        board[position.row][position.col] = piece.value
        return True
    
    def check_winner(self, board: List[List[Optional[str]]], last_position: Position, piece: PieceColor) -> Optional[PieceColor]:
        """Check if there's a winner after the last move"""
        directions = [
            (0, 1),   # horizontal
            (1, 0),   # vertical
            (1, 1),   # diagonal
            (1, -1),  # anti-diagonal
        ]
        
        for dx, dy in directions:
            count = 1  # Count the piece just placed
            
            # Check positive direction
            for i in range(1, 5):
                new_row = last_position.row + dx * i
                new_col = last_position.col + dy * i
                
                if (0 <= new_row < self.board_size and 
                    0 <= new_col < self.board_size and 
                    board[new_row][new_col] == piece.value):
                    count += 1
                else:
                    break
            
            # Check negative direction
            for i in range(1, 5):
                new_row = last_position.row - dx * i
                new_col = last_position.col - dy * i
                
                if (0 <= new_row < self.board_size and 
                    0 <= new_col < self.board_size and 
                    board[new_row][new_col] == piece.value):
                    count += 1
                else:
                    break
            
            if count >= 5:
                return piece
        
        return None
    
    def is_board_full(self, board: List[List[Optional[str]]]) -> bool:
        """Check if the board is full (draw condition)"""
        for row in board:
            for cell in row:
                if cell is None:
                    return False
        return True
    
    def get_ai_move(self, board: List[List[Optional[str]]], difficulty: str = "medium") -> Position:
        """AI logic with different difficulty levels"""
        if difficulty == "easy":
            return self._get_random_move(board)
        elif difficulty == "medium":
            return self._get_strategic_move(board)
        elif difficulty == "hard":
            return self._get_minimax_move(board)
        else:
            return self._get_strategic_move(board)
    
    def _get_random_move(self, board: List[List[Optional[str]]]) -> Position:
        """Random move for easy AI"""
        import random
        empty_positions = []
        for row in range(self.board_size):
            for col in range(self.board_size):
                if board[row][col] is None:
                    empty_positions.append(Position(row=row, col=col))
        
        if empty_positions:
            return random.choice(empty_positions)
        return Position(row=0, col=0)
    
    def _get_strategic_move(self, board: List[List[Optional[str]]]) -> Position:
        """Strategic AI that prioritizes winning and blocking"""
        ai_piece = PieceColor.WHITE
        player_piece = PieceColor.BLACK
        
        # 1. Check if AI can win in the next move
        win_move = self._find_winning_move(board, ai_piece)
        if win_move:
            return win_move
        
        # 2. Check if AI needs to block player from winning
        block_move = self._find_winning_move(board, player_piece)
        if block_move:
            return block_move
        
        # 3. Look for good strategic positions
        strategic_move = self._find_strategic_move(board, ai_piece)
        if strategic_move:
            return strategic_move
        
        # 4. Fallback to center or nearby positions
        return self._get_center_biased_move(board)
    
    def _find_winning_move(self, board: List[List[Optional[str]]], piece: PieceColor) -> Optional[Position]:
        """Find a move that creates 5 in a row"""
        for row in range(self.board_size):
            for col in range(self.board_size):
                if board[row][col] is None:
                    # Try placing piece here
                    test_board = [row[:] for row in board]
                    test_board[row][col] = piece.value
                    if self.check_winner(test_board, Position(row=row, col=col), piece):
                        return Position(row=row, col=col)
        return None
    
    def _find_strategic_move(self, board: List[List[Optional[str]]], piece: PieceColor) -> Optional[Position]:
        """Find moves that create multiple threats or extend sequences"""
        best_score = -1
        best_move = None
        
        for row in range(self.board_size):
            for col in range(self.board_size):
                if board[row][col] is None:
                    score = self._evaluate_position(board, Position(row=row, col=col), piece)
                    if score > best_score:
                        best_score = score
                        best_move = Position(row=row, col=col)
        
        return best_move
    
    def _evaluate_position(self, board: List[List[Optional[str]]], pos: Position, piece: PieceColor) -> int:
        """Evaluate how good a position is"""
        score = 0
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        
        for dx, dy in directions:
            # Count consecutive pieces in both directions
            count = 1
            open_ends = 0
            
            # Check positive direction
            for i in range(1, 5):
                new_row = pos.row + dx * i
                new_col = pos.col + dy * i
                
                if (0 <= new_row < self.board_size and 0 <= new_col < self.board_size):
                    if board[new_row][new_col] == piece.value:
                        count += 1
                    elif board[new_row][new_col] is None:
                        open_ends += 1
                        break
                    else:
                        break
                else:
                    break
            
            # Check negative direction
            for i in range(1, 5):
                new_row = pos.row - dx * i
                new_col = pos.col - dy * i
                
                if (0 <= new_row < self.board_size and 0 <= new_col < self.board_size):
                    if board[new_row][new_col] == piece.value:
                        count += 1
                    elif board[new_row][new_col] is None:
                        open_ends += 1
                        break
                    else:
                        break
                else:
                    break
            
            # Score based on count and open ends
            if count >= 4:
                score += 1000
            elif count == 3 and open_ends >= 1:
                score += 100
            elif count == 2 and open_ends >= 1:
                score += 10
            else:
                score += count
        
        return score
    
    def _get_center_biased_move(self, board: List[List[Optional[str]]]) -> Position:
        """Get a move biased towards the center"""
        center = self.board_size // 2
        
        # Try center first
        if board[center][center] is None:
            return Position(row=center, col=center)
        
        # Try positions near center
        for distance in range(1, center + 1):
            positions = []
            for dr in range(-distance, distance + 1):
                for dc in range(-distance, distance + 1):
                    if abs(dr) == distance or abs(dc) == distance:
                        row, col = center + dr, center + dc
                        if (0 <= row < self.board_size and 0 <= col < self.board_size 
                            and board[row][col] is None):
                            positions.append(Position(row=row, col=col))
            
            if positions:
                import random
                return random.choice(positions)
        
        # Fallback to first empty position
        for row in range(self.board_size):
            for col in range(self.board_size):
                if board[row][col] is None:
                    return Position(row=row, col=col)
        
        return Position(row=0, col=0)
    
    def _get_minimax_move(self, board: List[List[Optional[str]]], depth: int = 3) -> Position:
        """Advanced AI using minimax algorithm (simplified)"""
        # For now, use strategic move as minimax is complex to implement properly
        # This would be a full minimax implementation in a production system
        return self._get_strategic_move(board)
