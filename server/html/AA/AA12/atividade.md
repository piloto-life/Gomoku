Instruções AA12
Implemente o Fetch API no servidor virtual da UFSC (VPS-UFSC), disponível em https://idufsc.ufsc.br/cloud/vps, conforme segue:

Atividade em grupo (mesmo do PW).
Indique a URL completa desta atividade, e.g.:
<restante_endereço>.vms.ufsc.br/AA/AA12/index.html,
em que AA e AA12 são os diretórios para as Atividades Avaliadas (AA) e AA12 a atividade corrente.
[5,0] Na página (index.html) aprimore o cadastro implementado em prática anterior.
Implemente a tela de cadastro de usuário que contenha campos de endereço (CEP, Logradouro, Bairro, Município e Estado).
Após o usuário preencher o CEP, os demais campos devem ser preenchidos automaticamente.
Por exemplo, na tela a seguir, o usuário forneceu o CEP 13085415 e os demais campos foram preenchidos automaticamente:

Para fazer esta atividade, utilize a API de CEP do ViaCEP (https://viacep.com.br/) para preencher automaticamente os campos de acordo com o CEP informado.
Para receber uma resposta JSON, basta usar a Fetch API com a URL https://viacep.com.br/ws/CEPAQUI/json/, substituindo CEPAQUI pelo CEP sem separadores, e.g., https://viacep.com.br/ws/88040370/json/.
Após o cadastro, redirecione a página para o login para que o usuário se autentique e entre na página, conforme descreveu a atividade AA8.
Observe o feedback dado à correção do AA8 para melhorar/corrigir a implementação.
O cadastro deve habilitar o login.
[5,0] Após o login, no final da página index.html adicione dois seletores de opção (dropdown) com Fetch API para carregar dados de UFs e municípios a partir da API de localidades do IBGE (disponível em https://servicodados.ibge.gov.br/api/docs/localidades).
O primeiro deve ser carregado com valores de UFs disponívels pelo IBGE.
O segundo deverá ser habilitado apenas quando alguma UF for selecionada e, neste caso, deve listar todas as cidades da UF selecionadas no primeiro seletor de opção.
Em ambos os seletores os valores devem estar organizados em ordem alfabética crescente.
Exemplo:

Procure na API do IBGE qual a URL mais indicada para a sua requisição (obter uma lista de UFs e depois uma lista de municípios dada uma UF).