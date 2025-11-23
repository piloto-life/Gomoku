/**
 * Exercício 4 - Verificação de intervalos
 * Verifica se dois números estão nos intervalos [30,50] ou [60,100]
 */

function exercicio4() {
    try {
        // Solicitar o primeiro número
        const num1Input = prompt("Digite o primeiro número:");
        
        // Verificar se o usuário cancelou
        if (num1Input === null) {
            console.log("Operação cancelada pelo usuário.");
            return;
        }
        
        // Converter para número
        const num1 = parseFloat(num1Input);
        
        // Verificar se é um número válido
        if (isNaN(num1)) {
            console.log("Primeiro valor informado não é um número válido.");
            return;
        }
        
        // Solicitar o segundo número
        const num2Input = prompt("Digite o segundo número:");
        
        // Verificar se o usuário cancelou
        if (num2Input === null) {
            console.log("Operação cancelada pelo usuário.");
            return;
        }
        
        // Converter para número
        const num2 = parseFloat(num2Input);
        
        // Verificar se é um número válido
        if (isNaN(num2)) {
            console.log("Segundo valor informado não é um número válido.");
            return;
        }
        
        // Função auxiliar para verificar intervalos
        function verificarIntervalo(numero) {
            if (numero >= 30 && numero <= 50) {
                return "[30,50]";
            } else if (numero >= 60 && numero <= 100) {
                return "[60,100]";
            } else {
                return null;
            }
        }
        
        // Verificar intervalos para ambos os números
        const intervalo1 = verificarIntervalo(num1);
        const intervalo2 = verificarIntervalo(num2);
        
        console.log("=== Resultado da Verificação de Intervalos ===");
        
        // Exibir resultado para o primeiro número
        if (intervalo1) {
            console.log(`${num1} está no intervalo ${intervalo1}.`);
        } else {
            console.log(`O número ${num1} não está em nenhum dos dois intervalos.`);
        }
        
        // Exibir resultado para o segundo número
        if (intervalo2) {
            console.log(`${num2} está no intervalo ${intervalo2}.`);
        } else {
            console.log(`O número ${num2} não está em nenhum dos dois intervalos.`);
        }
        
        console.log("===============================================");
        
    } catch (error) {
        console.error("Erro durante a execução:", error.message);
    }
}



window.exercicio4 = exercicio4;
