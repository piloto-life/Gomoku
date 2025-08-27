Instruções AA2
1. Sobre a prática
Objetivo:

Criação de uma página web estática (HTML e CSS).
Use a codificação de texto UTF-8 na edição dos arquivos.

Utilize-a também nos arquivos HTML:
<meta charset="UTF-8">
Familizariação com HTML e criação de estrutura de páginas web.
Pesquisa sobre elementos HTML.
Conhecimento e implementação de elementos semânticos HTML
HTML semântico.
Início de estilização de página web com CSS.


2. Editor sugerido
Pode ser utilizado qualquer editor HTML/CSS. No entanto, recomenda-se:

Visual Studio Code
Plugins recomendados: Tools > VSCode/VSCodium [Extensions].
Live Preview.
Com os plugins para live server é possível implementar código e acompanhar as alterações em tempo real (recarregamento automático).


3. Browser
Pode-se utilizar qualquer navegador. Entretanto, recomenda-se o Firefox e/ou Google Chrome.


4. Página estática do projeto web
Crie uma página do projeto web em HTML
Invoque o arquivo HTML principal (index.html).
Crie um arquivo CSS para utilizar vinculação externa por meio de link.
Nomeie o arquivo CSS como style.css.
Inclua, por meio de link, seu arquivo style.css no arquivo index.html.
Consulte os slides da aula sobre CSS.
Pesquise sobre paletas de cores para a implementação.
Sugestão: colourlovers.com/palettes.


4.1. Conteúdo da página (requisitos)
A página web deve conter:

Definição do idioma como Português Brasileiro.
Título na aba do navegador.
Ícone na aba do navegador (favicon.ico).
Cabeçalho com link para navegação do conteúdo da página.
Utilize as tags <header> e <nav>.
Pesquise como criar links internos para elementos de sua página.
Uma barra lateral com informações relevantes.
Use a tag <aside>.
Exemplos de informações relevantes:
Integrantes do projeto web.
Curso com link para a página do curso.
Descrição do projeto.
Recursos usados no projeto.
Link para o github.
Rodapé com informações de contato do grupo e links úteis.
Use a tag <address>.
Nestes conteúdos cloque as seguintes sessões:
Sobre o projeto.
Objetivos.
Disciplina.
Links do projeto em repositórios (e.g., github).
Adicione outras informações que julgar relevante.
Crie uma segunda página (DOM.html) contendo a árvore (DOM - Document Object Model) da página web do projeto.
Em um dos itens de navegação da página index.html, crie um link do DOM.html.
Estabeleça um layout para a página do projeto por meio de CSS.
Pense em maneiras criativas de estilizar e usar seletores CSS.
Pesquise sobre propriedades que podem ser estilizadas.


5. Entrega
Códigos-fontes da implementação (compactado em ZIP).

Arquivo ZIP
Nome: grupo#_deploy.zip,
e.g., grupo1_deploy.zip.
Este ZIP contém os arquivos e diretórios contendo a implementação da atividade, e.g.,
CSS/style.css
index.html
_SimpleWebServer.sh
Script em Bash (Linux) disponível no tópico Sources Codes (_SimpleWebServer.sh), o qual deverá estar no mesmo diretório da página principal (index.html).
Dependência de pacotes (baseados em Debian):
$ sudo apt install php lsof xterm firefox-esr net-tools -y
Torne-o executável.
Console Linux
$ chmod 755 _SimpleWebServer.sh
ou
$ chmod +x _SimpleWebServer.sh
Execute-o no terminal (console Linux) ou duplo clique sobre o arquivo para renderizar a webpage.
Console Linux
$ ./_SimpleWebServer.sh
