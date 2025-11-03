from typing import List, Tuple

def check_win(board: List[List[str]], last_move: Tuple[int, int]) -> bool:
    """Check if the last move resulted in a win."""
    if not board or not board[0]:
        return False

    row, col = last_move
    player = board[row][col]
    if not player:
        return False

    rows, cols = len(board), len(board[0])

    def count_consecutive(dx: int, dy: int) -> int:
        """Count consecutive stones in a given direction."""
        count = 0
        for i in range(1, 5):
            r, c = row + i * dx, col + i * dy
            if 0 <= r < rows and 0 <= c < cols and board[r][c] == player:
                count += 1
            else:
                break
        return count

    # Check all 4 directions (horizontal, vertical, two diagonals)
    directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
    for dx, dy in directions:
        # Count in one direction and its opposite
        count = 1 + count_consecutive(dx, dy) + count_consecutive(-dx, -dy)
        if count >= 5:
            return True

    return False
