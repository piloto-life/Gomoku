/**
 * Exercício 3: Remove o primeiro e último caractere de uma string
 * Recebe uma string via prompt e exibe em alert sem o primeiro e último caractere
 */
function removerPrimeiroEUltimo() {
    // Solicita a string ao usuário
    const input = prompt("Digite uma string:");
    
    // Verifica se o usuário cancelou ou não digitou nada
    if (input === null) {
        alert("Operação cancelada pelo usuário.");
        return;
    }
    
    // Verifica se a string está vazia
    if (input === "") {
        alert("Você deve digitar alguma string!");
        return;
    }
    
    // Verifica se a string tem pelo menos 2 caracteres
    if (input.length < 2) {
        alert("A string deve ter pelo menos 2 caracteres para remover o primeiro e o último.");
        return;
    }
    
    // Remove o primeiro e último caractere usando substring
    const resultado = input.substring(1, input.length - 1);
    
    // Exibe o resultado
    if (resultado === "") {
        alert("String resultante está vazia (string original tinha apenas 2 caracteres).");
    } else {
        alert(`String original: "${input}"\nString sem primeiro e último caractere: "${resultado}"`);
    }
}