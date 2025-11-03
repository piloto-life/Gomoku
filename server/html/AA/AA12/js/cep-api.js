// Cache de elementos DOM
const cepInput = document.getElementById('cep');
const logradouroInput = document.getElementById('logradouro');
const bairroInput = document.getElementById('bairro');
const complementoInput = document.getElementById('complemento');
const ufSelect = document.getElementById('uf');
const municipioSelect = document.getElementById('municipio');

// Spinners
const cepSpinner = document.getElementById('cepSpinner');
const ufSpinner = document.getElementById('ufSpinner');
const municipioSpinner = document.getElementById('municipioSpinner');

// Máscara para CEP
cepInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 8);
    if (e.target.value.length === 8) {
        buscarCep(e.target.value);
    }
});

// Busca CEP via ViaCEP
async function buscarCep(cep) {
    try {
        cepSpinner.style.display = 'block';
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        logradouroInput.value = data.logradouro;
        bairroInput.value = data.bairro;
        complementoInput.value = data.complemento;
        
        // Selecionar UF e município nos dropdowns
        if (data.uf) {
            ufSelect.value = data.uf;
            await carregarMunicipios(data.uf);
            municipioSelect.value = data.localidade;
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('CEP não encontrado. Verifique o número informado.');
    } finally {
        cepSpinner.style.display = 'none';
    }
}

// Carrega UFs do IBGE
async function carregarUFs() {
    try {
        ufSpinner.style.display = 'block';
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        const estados = await response.json();
        
        estados.sort((a, b) => a.nome.localeCompare(b.nome));
        
        ufSelect.innerHTML = '<option value="">Selecione o estado</option>';
        estados.forEach(estado => {
            ufSelect.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar estados:', error);
        alert('Erro ao carregar lista de estados. Tente novamente mais tarde.');
    } finally {
        ufSpinner.style.display = 'none';
    }
}

// Carrega municípios do IBGE baseado na UF
async function carregarMunicipios(uf) {
    try {
        municipioSpinner.style.display = 'block';
        municipioSelect.disabled = true;
        
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        const municipios = await response.json();
        
        municipios.sort((a, b) => a.nome.localeCompare(b.nome));
        
        municipioSelect.innerHTML = '<option value="">Selecione o município</option>';
        municipios.forEach(municipio => {
            municipioSelect.innerHTML += `<option value="${municipio.nome}">${municipio.nome}</option>`;
        });
        
        municipioSelect.disabled = false;
    } catch (error) {
        console.error('Erro ao carregar municípios:', error);
        alert('Erro ao carregar lista de municípios. Tente novamente mais tarde.');
    } finally {
        municipioSpinner.style.display = 'none';
    }
}

// Event listener para mudança de UF
ufSelect.addEventListener('change', (e) => {
    municipioSelect.innerHTML = '<option value="">Selecione o município</option>';
    if (e.target.value) {
        carregarMunicipios(e.target.value);
    } else {
        municipioSelect.disabled = true;
    }
});

// Carrega UFs quando a página carrega
document.addEventListener('DOMContentLoaded', carregarUFs);