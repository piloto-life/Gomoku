import React from 'react';

interface GameEndModalProps {
  isOpen: boolean;
  winner?: string;
  message: string;
  onReturnToLobby: () => void;
  onPlayAgain?: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({
  isOpen,
  winner,
  message,
  onReturnToLobby,
  onPlayAgain
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal game-end-modal">
        <h2>Fim de Jogo</h2>
        <p className="game-end-message">{message}</p>
        {winner && <p className="game-end-winner">Vencedor: <b>{winner}</b></p>}
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onReturnToLobby}>
            Voltar ao Lobby
          </button>
          {onPlayAgain && (
            <button className="btn btn-secondary" onClick={onPlayAgain}>
              Jogar Novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameEndModal;
