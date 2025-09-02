function obterRegiaoFiscalAtravesDoCPFInformado(cpfInformado) {
    // Verifica se o CPF tem 11 dígitos
    if (!cpfInformado || cpfInformado.length !== 11) {
        return "CPF inválido - deve ter 11 dígitos";
    }
    
    // Verifica se todos os caracteres são dígitos
    if (!/^\d{11}$/.test(cpfInformado)) {
        return "CPF inválido - deve conter apenas números";
    }
    
    // Extrai o 9º dígito (índice 8, pois array começa em 0)
    let nonoDigito = parseInt(cpfInformado[8]);
    
    // Define as regiões fiscais baseadas no 9º dígito
    const regioesFiscais = {
        1: "1ª Região: DF, GO, MT, MS e TO",
        2: "2ª Região: AC, AP, AM, PA, RO e RR", 
        3: "3ª Região: CE, MA e PI",
        4: "4ª Região: AL, PB, PE e RN",
        5: "5ª Região: BA e SE",
        6: "6ª Região: MG",
        7: "7ª Região: ES e RJ",
        8: "8ª Região: SP",
        9: "9ª Região: PR e SC",
        0: "10ª Região: RS"
    };
    
    console.log(`CPF informado: ${cpfInformado}`);
    console.log(`9º dígito: ${nonoDigito}`);
    
    let regiaoFiscal = regioesFiscais[nonoDigito];
    
    return regiaoFiscal || "Região fiscal não encontrada";
}



function tratadorDeCliqueExercicio8() {
    let textCPF = document.getElementById("textCPF")
	let textRegiao = document.getElementById("regiaoFiscal")

    const regiaoFiscal = obterRegiaoFiscalAtravesDoCPFInformado(textCPF.value);
    textRegiao.textContent = "Região fiscal: "+regiaoFiscal
}
