


from symbols import * #importa os símbolos a serem inseridos na matriz do jogo
import random	#usado apenas nas jogadas da IA no modo PvE


#um objeto da classe admin não é um jogador, mas funciona como uma forma de "cuidador",
#montando o jogo e administrando as jogadas e condição de vitória
class Admin:
	def __init__(self, ):
		pass

#Cria uma lista de listas que será utilizada como a matriz do jogo, inserindo símbolos
#da tabela unicode em ordem, que são substituídos por peças dos jogadores em cada rodada 
	def createTable(self):
		table = []
		#cria todas as "linhas" da matriz
		for i in range(19):
			table.append([])

		#insere os símbolos na primeira linha
		table[0].append(corner1)
		for i in range(17):
			table[0].append(uhline)		
		table[0].append(corner2)

		#insere os símbolos na última linha
		table[18].append(corner3)
		for i in range(17):
			table[18].append(lhline)		
		table[18].append(corner4)

		#constrói todo o meio da matriz
		for i in range(1, 18):
			for j in range(19):
				if (j == 0):
					table[i].append(lvline)
				elif (j == 18):
					table[i].append(rvline)
				else:
					table[i].append(cross)		
				
		return table

#usado apenas para separar as rodadas visualmente no terminal
	def printLines(self):
		print("------------------------------------------------------------------------------")
	
#mostra de forma enumerada, linha a linha, a matriz do jogo
	def printTable(self, table):

		print()

		for i in range(len(table)):
			#mostra primeiro o "nome" da linha
			print(f'{chr(i+65)} ', end='')
			
			#mostra a linha atual, item a item, com uma linha horizontal após cada item
			for j in range(len(table[i])):
				if (j < len(table[i])-1):
					print(table[i][j], end=hline)	
				else:									
					print(table[i][j], end='')		
			print()

			#como uma última linha, mostra o "nome" de cada coluna
			if (i == 18):
				print(' '*2, end='')
				for n in range(19):
					print(f'{chr(n+65)}', end=' ')
				print()
		print()
		self.printLines()


#decodifica uma coordenada de jogada de caractere para inteiro.
#mantido com repetição redundante de código apenas para fins de organização
	def coordDecoder(self, c):
		if (len(c) > 1):
			temp = str(c)
			c = temp[1] 

		elif(len(c) < 1):
			c = 'z'
		
		c = ord(c)-97	   
		if (c >= 0 and c <= 18): #caso a entrada seja uma letra minuscula
			return c
		elif (c >= -32 and c <= -14):  #caso a entrada seja uma letra maiuscula
			c+=32
			return c
		return c

	#verifica se o pedido de inserção do jogador é valido, avaliando se há alguma peça
	#na posição pedida e se esta está dentro dos índices da matriz
	def checkValidInsertion(self, c1, c2, matrix):
		validCoordinates = (c1 >= 0 and c1 <= 18 and c2 >= 0 and c2 <= 18)
		if (validCoordinates):
			#spotOccupied pode ser declarado apenas se as coordenadas forem válidas,
			#caso contrário poderá ocorrer erro de indexação
			spotOccupied =  (matrix[c1][c2] == p1piece) or (matrix[c1][c2] == p2piece)
		else:
			return False

		if (not spotOccupied):
			return True
		else:
			return False 

	#checa se algum jogador venceu, procurando 5 peças em sequência na linha, coluna,
	#e diagonais que abrangem a coordenada da última peça inserida
	def winCheck(self, player, line, column, matrix):
		#Line check
		win = False
		inSequence = 0
		for j in range(len(matrix[line])):
			current = matrix[line][j]
			if  (current == player.piece):
				inSequence+=1
				if (inSequence == 5):
					win = True
			else:
				inSequence = 0

		#Column check
		inSequence = 0
		for i in range(len(matrix[line])):
			current = matrix[i][column]
			if  (current == player.piece):
				inSequence+=1
				if (inSequence == 5):
					win = True
			else:
				inSequence = 0

		#diagonal check
		if (line <= column):	#ocorre caso o último movimento tenha ocorrido acima
			inSequence = 0		#ou na própria diagonal principal
			currentLine = 0
			for j in range(column-line, 19):
				current = matrix[currentLine][j]
				if  (current == player.piece):
					inSequence+=1
					if (inSequence == 5):
						win = True
				else:
					inSequence = 0
				currentLine+=1

		elif (column < line):	#ocorre caso o último movimento tenha ocorrido abaixo
			inSequence = 0		#da diagonal principal
			currentColumn = 0
			for i in range(line-column, 19):
				current = matrix[currentColumn][i]
				if  (current == player.piece):
					inSequence+=1
					if (inSequence == 5):
						win = True
				else:
					inSequence = 0
				currentColumn-=1

		#counterdiagonal check
		if (line+column <= 18):	#ocorre caso o último movimento tenha ocorrido acima ou
			inSequence = 0		#na própria diagonal secundária
			currentLine = 0
			for j in range(column+line, -1, -1):
				current = matrix[currentLine][j]
				if  (current == player.piece):
					inSequence+=1
					if (inSequence == 5):
						win = True
				else:
					inSequence = 0
				currentLine+=1

		elif (column > line):	#ocorre caso o último movimento tenha ocorrido abaixo
			inSequence = 0		#da diagonal secundária
			currentColumn = 18
			for i in range(line-column, 19):
				current = matrix[currentColumn][i]
				if  (current == player.piece):
					inSequence+=1
					if (inSequence == 5):
						win = True
				else:
					inSequence = 0
				currentColumn-=1

		return win

	#insere a peça de um jogador no local designado caso a jogada seja válida, 
	#trocando um símbolo de construção da tabela pela peça do respectivo
	#jogador e chama a função de verificação de vitória
	def insertPiece(self, player, matrix): 
		insertion = False
		if (player.id == 1 or player.id == 2): #caso o jogador atual seja um jogador real
			print(player)
			while (not insertion):
				array = player.requestInsertion() 
				coord1 = self.coordDecoder(array[0]) 
				coord2 = self.coordDecoder(array[1])

				if (self.checkValidInsertion(coord1, coord2, matrix)):
					matrix[coord1][coord2] = player.piece
					self.printTable(matrix)
					insertion = True
				else:
					print()
					print("Invalid movement. Please, choose another.")
	
			return(self.winCheck(player, coord1, coord2, matrix))

		else:								#caso o jogador atual seja a IA
			print(player)
			while (not insertion):
				coord1 = random.randint(0,18)
				coord2 = random.randint(0,18)
	
				if (self.checkValidInsertion(coord1, coord2, matrix)):
					matrix[coord1][coord2] = player.piece
					print(f"Input row coordinate:{chr(coord1+65)}")
					print(f"Input column coordinate:{chr(coord2+65)}")
					self.printTable(matrix)
					insertion = True
	
			return(self.winCheck(player, coord1, coord2, matrix))