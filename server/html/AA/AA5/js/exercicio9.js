function haOnzeDigitos(cpf) {
    // Verifica se o CPF tem exatamente 11 caracteres
    return cpf && cpf.length === 11;
}

function todosOsOnzeDigitosSaoNumeros(cpf) {
    // Verifica se todos os 11 caracteres são dígitos numéricos
    return /^\d{11}$/.test(cpf);
}

function osOnzeNumerosSaoDiferentes(cpf) {
    // Verifica se nem todos os dígitos são iguais
    // CPFs como 11111111111, 22222222222, etc. são inválidos
    const primeiroDigito = cpf[0];
    return !cpf.split('').every(digito => digito === primeiroDigito);
}

function oPrimeiroDigitoVerificadorEhValido(cpf) {
    // Calcula o primeiro dígito verificador (10º dígito)
    let soma = 0;
    
    // Multiplica cada um dos 9 primeiros dígitos por números decrescentes de 10 a 2
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    
    // Calcula o resto: (soma * 10) % 11
    let resto = (soma * 10) % 11;
    
    // Se o resto for 10, usa 0 no lugar
    if (resto === 10) {
        resto = 0;
    }
    
    // Compara com o 10º dígito do CPF
    return resto === parseInt(cpf[9]);
}

function oSegundoDigitoVerificadorEhValido(cpf) {
    // Calcula o segundo dígito verificador (11º dígito)
    let soma = 0;
    
    // Multiplica cada um dos 10 primeiros dígitos por números decrescentes de 11 a 2
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    
    // Calcula o resto: (soma * 10) % 11
    let resto = (soma * 10) % 11;
    
    // Se o resto for 10, usa 0 no lugar
    if (resto === 10) {
        resto = 0;
    }
    
    // Compara com o 11º dígito do CPF
    return resto === parseInt(cpf[10]);
}





//------------------- Não edite abaixo ----------------------------
function validarCPF(validacao, cpf) {
    switch (validacao) {
        case "onzeDigitos": return haOnzeDigitos(cpf)
        case "onzeSaoNumeros": return todosOsOnzeDigitosSaoNumeros(cpf) && validarCPF("onzeDigitos", cpf)
        case "naoSaoTodosIguais": return osOnzeNumerosSaoDiferentes(cpf) && validarCPF("onzeSaoNumeros", cpf)
        case "verificador10": return oPrimeiroDigitoVerificadorEhValido(cpf) && validarCPF("naoSaoTodosIguais", cpf)
        case "verificador11": return oSegundoDigitoVerificadorEhValido(cpf) && validarCPF("verificador10", cpf)

        default:
            console.error(validacao+" é um botão desconhecido...")
            return false
    }
}


function tratadorDeCliqueExercicio9(nomeDoBotao) {
    const cpf = document.getElementById("textCPF").value

    const validacao = (nomeDoBotao === "validade") ? "verificador11": nomeDoBotao
    const valido = validarCPF(validacao, cpf)
    const validoString = valido ? "valido": "inválido"
    const validadeMensagem = "O CPF informado ("+cpf+") é "+ validoString
    console.log(validadeMensagem)

    if (nomeDoBotao !== "validade") {
        let divResultado = document.getElementById(validacao);
        divResultado.textContent = validoString
        divResultado.setAttribute("class", valido ? "divValidadeValido": "divValidadeInvalido")    
    } else {
        window.alert(validadeMensagem)
    }

    
}