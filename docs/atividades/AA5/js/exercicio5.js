function convertCelciusToFahrenheit(celcius) {
	// Converte Celsius para Fahrenheit usando a fórmula: F = (C × 9/5) + 32
	// Primeiro converte para número para garantir que seja um valor numérico
	const celsius = parseFloat(celcius);
	
	// Verifica se o valor é um número válido
	if (isNaN(celsius)) {
		return "Valor inválido";
	}
	
	// Aplica a fórmula de conversão
	const fahrenheit = (celsius * 9/5) + 32;
	
	// Retorna o resultado com 2 casas decimais
	return fahrenheit.toFixed(1);
}





// -- Não edite abaixo!

function conversaoCtoF() {
	let textCelcius = document.getElementById("celciusText")
	let textFahrenheit = document.getElementById("resultFahrenheit")
	textFahrenheit.textContent = convertCelciusToFahrenheit(textCelcius.value) + 
								 "ºF"
}