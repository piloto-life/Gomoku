/**
 * Exercício 6: Inverter String
 * Função que recebe uma string via prompt e exibe a string invertida no console
 */
function inverterString() {
    // Solicita uma string ao usuário através de um prompt
    const texto = prompt("Digite uma string para inverter:");
    
    // Verifica se o usuário inseriu algum texto
    if (texto === null) {
        console.log("Operação cancelada pelo usuário.");
        return;
    }
    
    if (texto === "") {
        console.log("Nenhuma string foi informada.");
        return;
    }
    
    // Inverte a string usando split, reverse e join
    const textoInvertido = texto.split('').reverse().join('');
    
    // Exibe o resultado no console
    console.log(`String original: "${texto}"`);
    console.log(`String invertida: "${textoInvertido}"`);
}