

#--------- 	IMPORTS  ----------

from symbols import *
import admin
import symbols
import admin
import player



#--------- FUNCTIONS ---------

#mantém o(s) jogador(es) em loop até que um modo válido seja escolhido
def gameMode():
	print()
	print()
	print("------------------------------------------------------------------------------")
	print()
	print("                            Welcome to Gomoku!                                ")
	print()
	print("How do you wish to play?")
	print("1 - PvP")
	print("2 - PvE")

	loop = True
	while loop:
		n = input(': ')
		if (n == '1' or n == '2'):
			return n
		else:
			print()
			print("Invalid mode, please try selecting again.")
			print("1 - PvP")
			print("2 - PvE")


#encerra o jogo indicando o vencedor ou empate
def gameEnding(moves):
	if (moves < 361):
		print(f'                           {currentPlayer} wins!                           ')
		print("                        Thank you for playing.                              ")
		print("                      Please, never come back  =)                           ")
	
	else:
		print(f'                           It\'s a draw!                                   ')
		print("                        Thank you for playing.                              ")
		print("                      Please, never come back  =)                           ")




#-------- GAME INIT  -------------

dungeonMaster = admin.Admin()
gameMatrix = dungeonMaster.createTable()
mode = gameMode()


#inicializando o jogo com diferentes comentários de acordo com o modo selecionado (PvE ou PvP)
if (mode == '1'):
	print()
	print("PvP selected")	
	p1 = player.Player(1)
	p2 = player.Player(2)

	print("Player 1 starts, with black pieces.")
	print("Please, select your first move using the coordinates below:")
	dungeonMaster.printTable(gameMatrix)
	dungeonMaster.insertPiece(p1, gameMatrix)
	print("Now player 2, please choose coordinates to insert piece:")
	dungeonMaster.insertPiece(p2, gameMatrix)


else:	#mode == '2'
	print()
	print("PvE selected")		
	p1 = player.Player(1)
	p2 = player.Player("AI")

	print("Player starts, with black pieces.")
	print("Please, select your first move using the coordinates below:")
	dungeonMaster.printTable(gameMatrix)
	dungeonMaster.insertPiece(p1, gameMatrix)
	dungeonMaster.insertPiece(p2, gameMatrix)


#------- MAIN LOOP ----------------

#mantém os jogadores em loop, alternando quem joga a cada iteração do loop,
#sempre iniciando com o jogador de peças pretas
gameLoop = True
currentPlayer = p2
moves = 0
while (gameLoop and moves < 361):
	if (currentPlayer == p2):
		currentPlayer = p1
	else:
		currentPlayer = p2

	gameLoop = not dungeonMaster.insertPiece(currentPlayer, gameMatrix)	#insertPiece also returns winCheck
	moves+=1


gameEnding(moves)