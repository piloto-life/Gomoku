document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupLoginValidation();
    setupNovaContaValidation();
});

function ocultarTudo() {
    document.getElementById('divHome').style.display = 'none';
    document.getElementById('login-body').style.display = 'none';
    document.getElementById('nova-conta').style.display = 'none';
}

window.mostrarApenasHome = function() {
    ocultarTudo();
    document.getElementById('divHome').style.display = 'block';
}

window.mostrarApenasLogin = function() {
    ocultarTudo();
    document.getElementById('login-body').style.display = 'block';
    
    const loginForm = document.getElementById('login-body').querySelector('form');
    loginForm.reset();
    document.getElementById('botaoLogin').disabled = true;
}

window.mostrarApenasConta = function() {
    ocultarTudo();
    document.getElementById('nova-conta').style.display = 'block';

    const novaContaForm = document.getElementById('nova-conta').querySelector('form');
    novaContaForm.reset();
    const statusParas = novaContaForm.querySelectorAll('p[id^="status"]');
    statusParas.forEach(p => p.innerHTML = '');
    novaContaForm.querySelector('input[type="button"]').disabled = true;
}

function initializePage() {
    mostrarApenasHome();
}

function setupLoginValidation() {
    const emailInput = document.querySelector('#login-body input[type="text"]');
    const passwordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('botaoLogin');

    function validateLogin() {
        const isEmailValid = emailInput.value.includes('@') && emailInput.value.split('@').length - 1 === 1;
        const isPasswordValid = passwordInput.value.length > 0;
        loginButton.disabled = !(isEmailValid && isPasswordValid);
    }
    emailInput.addEventListener('input', validateLogin);
    passwordInput.addEventListener('input', validateLogin);
}

class CPF {
    constructor(cpfString) {
        const cpf = cpfString.replace(/[^\d]/g, '');
        if (cpf.length !== 11) {
            throw new Error("CPF deve conter 11 dígitos.");
        }
        if (/^(\d)\1+$/.test(cpf)) {
            throw new Error("CPF inválido (dígitos repetidos).");
        }

        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) {
            throw new Error("CPF inválido.");
        }

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) {
            throw new Error("CPF inválido.");
        }

        this.cpf = cpf;
    }
}

class Conta {
    constructor(nome, sobrenome, cpfObj, email, senha) {
        this.nome = nome;
        this.sobrenome = sobrenome;
        this.cpf = cpfObj.cpf;
        this.email = email;
        this.senha = senha;
    }
}

function setStatus(elementId, message, isSuccess) {
    const statusElement = document.getElementById(elementId);
    if (isSuccess) {
        statusElement.innerHTML = `<span class="status-ok">${message} <i class="material-icons" style="font-size: 1em; vertical-align: middle;">check_circle</i></span>`;
    } else {
        statusElement.innerHTML = `<span class="status-fail">${message}</span>`;
    }
}

window.validaTextoEmBranco = function(inputElement, statusId, fieldName) {
    if (inputElement.value.trim() === "") {
        setStatus(statusId, `${fieldName} não pode estar em branco.`, false);
        return false;
    }
    setStatus(statusId, ``, true);
    return true;
}

window.validarCPF = function(inputElement) {
    const statusId = 'statusCPF';
    try {
        new CPF(inputElement.value);
        setStatus(statusId, 'CPF válido.', true);
        return true;
    } catch (e) {
        setStatus(statusId, e.message, false);
        return false;
    }
}

function setupNovaContaValidation() {
    const form = document.querySelector('#nova-conta form');
    const createButton = form.querySelector('input[type="button"]');
    
    const fields = {
        nome: { el: form.querySelector('input[onblur*="statusNome"]'), valid: false },
        sobrenome: { el: form.querySelector('input[onblur*="statusSobrenome"]'), valid: false },
        cpf: { el: form.querySelector('input[onblur*="validarCPF"]'), valid: false },
        email: { el: form.querySelectorAll('input[type="text"]')[3], valid: false },
        senha: { el: form.querySelectorAll('input[type="password"]')[0], valid: false },
        repitaSenha: { el: form.querySelectorAll('input[type="password"]')[1], valid: false }
    };
    
    function checkAllValid() {
        const allValid = Object.values(fields).every(field => field.valid);
        createButton.disabled = !allValid;
    }

    fields.nome.el.addEventListener('blur', () => {
        fields.nome.valid = validaTextoEmBranco(fields.nome.el, 'statusNome', 'Nome');
        checkAllValid();
    });

    fields.sobrenome.el.addEventListener('blur', () => {
        fields.sobrenome.valid = validaTextoEmBranco(fields.sobrenome.el, 'statusSobrenome', 'Sobrenome');
        checkAllValid();
    });

    fields.cpf.el.addEventListener('blur', () => {
        fields.cpf.valid = validarCPF(fields.cpf.el);
        checkAllValid();
    });

    fields.email.el.addEventListener('blur', () => {
        if (fields.email.el.value.trim() === "") {
            setStatus('statusEmail', 'E-mail não pode estar em branco.', false);
            fields.email.valid = false;
        } else if (!fields.email.el.value.includes('@') || fields.email.el.value.split('@').length - 1 !== 1) {
            setStatus('statusEmail', 'E-mail deve conter um único @.', false);
            fields.email.valid = false;
        } else {
            setStatus('statusEmail', 'E-mail válido.', true);
            fields.email.valid = true;
        }
        checkAllValid();
    });
    
    const validatePasswords = () => {
        const senhaVal = fields.senha.el.value;
        const repitaSenhaVal = fields.repitaSenha.el.value;

        if (senhaVal === "" || repitaSenhaVal === "") {
            setStatus('statusSenha', 'Senha não pode estar em branco.', false);
            setStatus('statusRepitaSenha', '', false);
            fields.senha.valid = false;
            fields.repitaSenha.valid = false;
        } else if (senhaVal !== repitaSenhaVal) {
            setStatus('statusSenha', 'As senhas não coincidem.', false);
            setStatus('statusRepitaSenha', 'As senhas não coincidem.', false);
            fields.senha.valid = false;
            fields.repitaSenha.valid = false;
        } else {
            setStatus('statusSenha', 'Senhas válidas.', true);
            setStatus('statusRepitaSenha', 'Senhas coincidem.', true);
            fields.senha.valid = true;
            fields.repitaSenha.valid = true;
        }
        checkAllValid();
    };

    fields.senha.el.addEventListener('input', validatePasswords);
    fields.repitaSenha.el.addEventListener('input', validatePasswords);
    
    createButton.addEventListener('click', () => {
        if (!createButton.disabled) {
            try {
                const cpfObject = new CPF(fields.cpf.el.value);
                const newAccount = new Conta(
                    fields.nome.el.value,
                    fields.sobrenome.el.value,
                    cpfObject,
                    fields.email.el.value,
                    fields.senha.el.value
                );
                console.log("Nova conta criada:", newAccount);
                alert("Conta criada com sucesso.");
                mostrarApenasHome();
            } catch (e) {
                alert("Erro ao criar a conta: " + e.message);
            }
        }
    });
}