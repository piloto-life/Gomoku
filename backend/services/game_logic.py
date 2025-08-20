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
    
    def make_move(self, board: List[List[Optional[str]]], position: Position, piece: PieceColor) -> List[List[Optional[str]]]:
        """Make a move on the board"""
        new_board = [row[:] for row in board]  # Deep copy
        new_board[position.row][position.col] = piece.value
        return new_board
    
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
    
    def get_ai_move(self, board: List[List[Optional[str]]]) -> Position:
        """Simple AI logic - find first available position"""
        # This is a very basic AI - just finds the first empty spot
        # TODO: Implement more sophisticated AI logic
        for row in range(self.board_size):
            for col in range(self.board_size):
                if board[row][col] is None:
                    return Position(row=row, col=col)
        
        # Should never reach here if board is not full
        return Position(row=0, col=0)
