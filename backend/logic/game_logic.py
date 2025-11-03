from typing import List, Optional

def check_win(board: List[List[Optional[str]]], row: int, col: int) -> Optional[str]:
    """Check whether the move at (row, col) produced a winner.

    Returns the color string ('black' or 'white') when there's a winner,
    or None otherwise. This signature matches the expectations used in
    the test-suite (check_win(board, row, col)).
    """
    # Basic validations
    if not board or not board[0]:
        return None

    if row < 0 or col < 0 or row >= len(board) or col >= len(board[0]):
        return None

    if board[row][col] is None:
        return None

    color = board[row][col]
    directions = [(0, 1), (1, 0), (1, 1), (1, -1)]

    for dr, dc in directions:
        count = 1

        # forward direction
        r, c = row + dr, col + dc
        while 0 <= r < len(board) and 0 <= c < len(board[0]) and board[r][c] == color:
            count += 1
            r += dr
            c += dc

        # backward direction
        r, c = row - dr, col - dc
        while 0 <= r < len(board) and 0 <= c < len(board[0]) and board[r][c] == color:
            count += 1
            r -= dr
            c -= dc

        if count >= 5:
            return color

    return None
