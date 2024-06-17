from symbols import *

#A classe Player define a identidade de cada jogador (1, 2 ou IA), qual a sua peça, 
#e um método para requisitar uma jogada
class Player:

	def __init__(self, id):

		self.id = id

		if (id == 1):
			self.piece = p1piece
		elif (id == 2 or id == 'AI'):
			self.piece = p2piece

	def __str__(self):
		if (self.id == 1 or self.id == 2):
			return (f'Player {self.id}')
		else:
			return(self.id)

	def requestInsertion(self):
		coord1 = input("Input row coordinate: ")
		coord2 = input("Input column coordinate: ")

		return [coord1, coord2]
