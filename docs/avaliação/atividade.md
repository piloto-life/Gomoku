Ir para o conteúdo principal
Imprimir o livro todoImprimir o livro todo
Instruções para o PW
Site:	Moodle UFSC - Apoio aos Cursos Presenciais
Curso:	INE5646-03238A (20252) - Programação para Web
Livro:	Instruções para o PW
Impresso por:	Luan Rodrigo da Silva Costa (23151291)
Data:	domingo, 23 nov. 2025, 09:39
Índice
1. Projeto Web
2. Requisitos da aplicação web
3. Temas disponíveis
4. Escrita do projeto
4.1. Sobre a escrita
5. Apresentação do projeto
6. Critérios de pontuação
7. Entrega
8. FAQ
1. Projeto Web
O projeto web (escrita, implementação e apresentação) deverá ser organizado em grupo de dois (2) discentes. Este projeto envolverá os principais conceitos e técnicas abordados na disciplina. A parte escrita do projeto será em formato de artigo em LATEX
, conforme template disponibilizado. A apresentação (website  HTML/CSS/JS/framework online) deverá contemplar aspectos téoricos (de forma sucinta) e focar principalmente em aspectos de implementação (aplicação) e de monstração/resultados.

O agente de usuário padrão adotado na disciplina será o Firefox. Entretanto, recomenda-se que seja verificada a compatibilidade das implementações no Chrome.

2. Requisitos da aplicação web
Os requisitos da aplicação do Projeto Web são enumerados a seguir.

Aplicação
HTTPS.
Disponibilização: 24/7.
Server:
Apenas no servidor virtual da UFSC (VPS-UFSC).
Front-end:
Responsive (desktop e mobile).
Back-end:
BD: MongoDB (obrigatório).
Padrão de projeto:
MVC.
Recursos de segurança:
Resilência contra:
Execução de código malicioso:
XSS (Cross-site scripting).
CSRF (Cross-Site Request Forgery).
etc.
Exposição de dados sensíveis.
Ataques de injeção de código.
Tecnologias/frameworks:
Obrigatório (mínimo):
HTML5, CSS3, JavaScript e MongoDB.
Para BD, apenas o MongoDB será permitido, conforme já descrito.
Livre:
Outras tecnologias e/ou frameworks podem ser implementados em back-end e front-end, e.g., Angular, Django, Electron, Ember.js, Express.Js, Flask, Flet, Flutter, GraphQL, Ionic, JQuery, Laravel, Next.js, PHP, React, React Native, Spring, TypeScript, Vite, Vue.js.
Interface
Tabuleiro (espaço do jogo).
Modos de visualização:
Light
Dark
Imagem do usuário:
Avatar, imagem ou webcam.
Opção de exibir/ocultar:
Fila de jogadores.
Vídeochat:
Webcam com áudio:
Apenas para os dois jogadores em partida.
Áudio do Vídeochat.
Áudio geral:
Vídeochat.
Efeitos sonoros.
Chat (escrito).
Selecionar:
Jogadores ativos (2 jogadores em partida).
Geral (jogadores ativos e em fila de espera).
Persistir:
Rank de pontuação:
Nome do jogador, data/hora etc.
High score.
Gravação (com FFMPEG) da partida:
Vídeo:
Gerenciado pelo MongoDB.
Compartilhável por URL.
WebM:
Bitrate: [default: 4 Mbit/s].
FPS: [default: 24].
Áudio:
Bitrate: [default: 128 kbit/s].
Canais: [default: 2 (stereo)].
Taxa de amostragem: [default: 44100].
Área de gravação:
Full screen [default: no]:
Tela completa (incluir Vídeochat, chat escrito).
Default:
Partida (tabuleiro, pontuação, nomes dos jogadores).
Modos de jogo:
Bot.
Humanos.
Seleção de jogadores:
Botão para confirmar o início da partida.
Compartilhamento:
Dados de partida.
Vídeos de partidas gravadas.
Administrador
CRUD.
Gerenciamento:
Avatares-default.
Jogadores online:
Tempo de inatividade (em segundos):  [default: 60 segundos].
Se expirar este tempo o próximo jogador selecionado da fila.
Tamanho máximo de fila de jogadores: [default: 25].
Limites:
Armazenamento de vídeo no server:
Tempo máximo: [default: 15 dias].
Size: [default: 1 GB].
Banco de Dados:
Obrigatoriamente: MongoDB.
CRUD.
Usuário
Cadastro:
Nome (nickname).
Idade.
Local:
Cidade.
Estado.
País.
Avatar:
Imagem:
A partir de URL, disco, webcam etc.
Senha.
Atualização/modificação de dados cadastrais.
Acesso autenticado.
Dados armazenados:
Partidas.
Data/hora.
Nome do oponente.
Pontuação.
Vídeo (gravação).
Outros dados que julgar relevantes.
Compartilhamento:
Pontuação:
Oponentes.
Data/hora.
Vídeo:
URL, a partir do BD da partida jogada.
No link disponibilizado implemente um player simples (áudio/vídeo).
3. Temas disponíveis
A seguir são descritos os temas para o desenvolvimento do Projeto Web.

Jogo com dois players, cujos temas estão disponíveis na escolha dos grupos PW.

4. Escrita do projeto
A parte escrita do Projeto Web (EP) deverá ser em formato de artigo em LATEX
 OBRIGATORIAMENTE, conforme template disponibilizado, cuja estrutura deverá conter:

Título.
Nomes dos dois integrantes do projeto com a identificação do curso e da instituição, conforme template.
Resumo (abstract).
Introdução
Motivação.
Problema.
Trabalhos relacionados.
Contribuição do trabalho.
Organização do restante do trabalho.
Fundamentação teórica
Apresente os aspectos teóricos relacionados ao trabalho/projeto.
Materiais e Métodos.
Descrição de frameworks, tecnologias, APIs e demais recursos implementados.
A metodologia empregada no trabalho.
Softwares usados e códigos implementados.
Apresente um roteiro de instalação e configuração detalhados.
Link do projeto disponibilizado (link da página web).
Resultados
Apresente
Árvore (DOM).
Estrutura do projeto.
Padrão: MVC.
Descreva e discuta os resultados obtidos.
Apresente screens de tela.
Apresente e discuta O MVC.
Aponte problemas encontras.
Discuta as vulnerabilidades e soluções de segurança relaciondas à implementação do projeto.
Conclusão(ões).
Referências.
Apêndices.
Use o pacote listings (\usepackage{listings}) para decoração de código e inserção de números de linhas.
Todos códigos implementados com links de repositório.
Anexos.
Use o pacote listings (\usepackage{listings}) para decoração de código e inserção de números de linhas.
Códigos de terceiros usados.
4.1. Sobre a escrita
Eis algumas dicas para a elaboração da parte escrita do Projeto Web.

Obedeça à estrutura e estilo do template em LATEX
.
Não deixe lacunas (hiatos) ou espaços vazios entre seções, figuras, tabelas. Faça as seções de forma que o conteúdo fique contínuo.

Inclua trabalhos relacionados na Introdução. Descreva em detalhes o trabalho em termos do campo de conhecimento requerido.
Trabalhos relacionados ou estado da arte são trabalhos que apresentam ideia próxima ou similar publicados em revistas científicas, em anais de congresso ou em livros. Faça a citação (referencie) os trabalhos publicados.
Faça um detalhamento de cada trabalho, não cite apenas. Ao fazer esse detalhamento será possível comparar com o trabalho proposto e destacar a contribuição.

A Fundamentação Teórica como o próprio título da seção sugere, aborda aspectos teóricos acerca do trabalho.
Não faça apenas a citação de trabalhos. Opte pelo detalhamento de aspectos teóricos mais importantes, os quais estão diretamente relacionados ao trabalho proposto.

Em Metodologia (ou Materiais e Métodos) descreva os softwares, ferramentas e métodos que serão empregados para avaliar o desempenho do trabalho ou a metodologia estatística que será abordada. 

Não use primeira pessoa. Seja impessoal, e.g., ao invés de "temos" opte por "tem-se".

Siglas: na primeira ocorrência deve-se explicitar o termo entre parênteses. Caso o termo seja estrangeiro, deve-se fazê-lo em itálico.
Exemplo:
(...) a tecnologia IoT (Internet of Things) está ampliando o acesso (...). Logo, IoT traz inúmeros benefícios, segundo aponta os autores em [2] (...).
Observe que na primeira citação, a sigla/acrônimo foi explicitado (em itálico). No decorrer do texto, após a primeira citação, utilizou-se o acrônimo normalmente.
Estrangeirismos grafados sem itálico ou aspas: 
https://www12.senado.leg.br/manualdecomunicacao/verbetes-acessorio/estrangeirismos-grafados-sem-italico-ou-aspas.

Não utilize termos como "através", a menos que seja necessário. Ao invés de "através" opte por "por meio de/da/do".
Uso necessário/adequado: o projétil fez uma trajetória horizontal através do crânio robótico do dummy.

Evite usar "onde", a não ser que seja necessário. Opte por em que. Exemplo:
e=mc2
,                        (1)
em que m
, representa a massa. Note que após a equação há uma vírgula (,). Na outra linha, sem espaço (continuando o parágrafo) começou com "em que". Caso não houvesse explicação de algum termo da equação, terminaria a equação com ponto final (.).

Não utilize termos coloquiais e expressões exageradamente qualificadoras.
Exemplo: o sistema desenvolvido neste trabalho apresentou um desempenho muito bom.
Opte por: o sistema proposto apresentou um desempenho 80% superior ao trabalho proposto por Dirac e Einstein [10].
Observe que foi realizada uma comparação numérica (percentual) e não uma qualificação.

Toda afirmação de cunho teórico ou metodológico deve ser apoiada na literatura (referência de revista científica, livro, trabalho de congresso etc.).

Seja objetivo, claro e preciso. 

Cite figuras e tabelas, faça o detalhamento e as exiba. Siga esta ordem. Deve-se usar Figura 1, Tabela I, ... Observe que são maiúsculas. Exemplo: a Figura 1 apresenta o fluxo de dados que flui do Host A ao Host B, a uma taxa de 300 kbit/s em um canal sujeito a ruído gaussiano. Na sequência, a figura é exibida.

Não use termos como "abaixo", "acima", "ao lado"... Não é usual em trabalhos científicos. Além disso, o elemento relacionado pode mudar de posição, e.g., A Figura 1 abaixo exibe o comportamento...  Neste caso, o uso destes termos poderá informar erroneamente a posição de um elemento presente no texto.

Ao abrir uma seção ou subseção, faça-a com parágrafo(s). Não abra uma seção com subseção, tópicos, figuras, tabelas etc.

Ao encerrar uma seção ou subseção, termine-a com parágrafo(s). Não conclua uma seção ou subseção com tópicos, figuras, tabelas etc.

Não represente uma tabela por meio de figura.
5. Apresentação do projeto
Estas são as condições para apresentação do Projeto Web (AP).

Tempo de apresentação: 20 minutos com 5 minutos de tolerância.
Apresentação deverá ser pensado tanto no ponto de vista de desenvolvedor quanto de usuário.
A nota da da apresentação serão individual, conforme desempenho do integrante do grupo.
Apresente a parte teórica de forma sucinta.
Apresente as principais partes do código.
Faça a demonstração prática do projeto web com todas as funcionalidades.
Autenticação.
Cadastro.
Use de base de dados (back-end).
Compartilhamento de dados de usuários.
Discuta e apresente os aspectos de segurança envolvidos no projeto.
Evite temas (templates para apresentação) escuros, pois dificultam a visualização em datashow.
Antes de prosseguir com o tema escolhido, teste-o com datashow em uma sala de aula.
Requisitos:
A apresentação deverá ser implementada em HTML, CSS e JavaScript em formato de slide/frame.
Frameworks:
https://revealjs.com.
Integração com LATEX
.
Example Presentations.
Plugins, Tools and Hardware
https://quarto.org.
Integração com LATEX
, Python.
https://impress.js.org.
https://github.com/slidevjs/slidev.
https://sli.dev.
https://github.com/FormidableLabs/spectacle.
https://github.com/webpro/reveal-md.
https://github.com/webslides/WebSlides.
Servidor online 24/7.
Servidor Virtual UFSC.
Poderão ser incorporados recursos HTML/CSS/JS na apresentação para incorporar e/ou referenciar o projeto, e.g., <embed> (menos seguro), <iframe>, links (<a>).
6. Critérios de pontuação
As notas serão disponibilizadas após a conclusão de todas as apresentações. A pontuação de alguns itens (relacionados à estética, complexidade, organização, desempenho e implementação eficiente) será baseada na comparação entre os projetos apresentados. O PW deverá ser implementado (deploy) no VPS-UFSC.

Os critérios a seguir serão usados para compor os itens de nota EP e AP.

Requisitos da Aplicação/Apresentação (AP)          Pontuação  Total
Website disponível 24/7 em server HTTPS (VPS UFSC) 0,500      0,50
Padrão de projeto: MVC............................ 0,500      1,00
Front-end
 - Autenticação................................... 0,500      1,50
 - Chat (usuários em fila e em partida)........... 0,500      2,00
 - Fila de jogadores.............................. 0,500      2,50
 - Gravação da sessão (screen com vídeo e áudio).. 0,500      3,00
 - Layout responsivo (desktop e mobile)........... 0,500      3,50
 - Modo de jogo:
   - Convencional (jogadores humanos)............. 0,125      3,625
   - Com bot...................................... 0,125      3,75
 - Modo de visualização light e dark.............. 0,125      3,875
 - Pontuação:
   - Rank de pontuação (jogador, data/hora)....... 0,125      4,00
   - High score................................... 0,125      4,125
 - Oculta/exibir:
   - Áudio do vídeochat........................... 0,125      4,25
   - Áudio global................................. 0,125      4,375
   - Chat:
     - Jogadores ativos........................... 0,125      4,50
     - Global (todos jogadores)................... 0,125      4,625
   - Fila de jogadores............................ 0,125      4,75
   - Videochat.................................... 0,125      4,875
 - Vídeochat (Webcam + Áudio)..................... 0,500      5,375
Back-End
 - MongoDB........................................ 1,000      6,375
 - CRUD:
   - Cadastro de usuários
     - Nome, avatar/imagem, local, senha.......... 0,125      6,50
   - Leitura de dados armazenados
     - Partidas, data/hora, nome do oponente,
       pontuação, vídeo (gravação) etc............ 0,250      6,75
   - Atualização de dados cadastrados............. 0,250      7,00
   - Banimento/exclusão de jogadores.............. 0,250      7,25
   - Compartilhamento de dados entre jogadores
     - Pontuação, data/hora, URL da gravação e 
       outros dados que julgar relevantes......... 0,125      7,375
 - Gerenciamento:
   - Avatares..................................... 0,125      7,50
   - Jogadores online:
     - Tempo de inatividade....................... 0,125      7,625
     - Tamanho máximo de fila de jogadores........ 0,125      7,75
   - Limites:
     - Armazenamento de vídeo no server:
       - Tempo máximo (default: 15 dias).......... 0,125      7,875
       - Size (default 1 GB)...................... 0,125      8,00
 - Aspectos de segurança
   - Testes de vulnerabilidade.................... 0,250      8,25
   - Soluções de segurança........................ 0,250      8,50
Apresentação no server HTTPS (framework reveal.js) 1,000      9,50
Postagem dos códigos-fonte: grupo#_ap.zip......... 0,500     10,00


Requisitos do Trabalho Escrito (EP)                Pontuação  Total
Elaborado conforme template em LATEX
.............. 1,00       1,00
Título/Autores/Departamento/Instituição........... 0,25       1,25
Resumo............................................ 0,25       1,50
Introdução                                        
 - Motivação...................................... 0,25       1,75
 - Problema....................................... 0,25       2,00
 - Trabalhos relacionados......................... 0,25       2,25
 - Contribuição do trabalho....................... 0,25       2,50
 - Descrição da organização do trabalho........... 0,25       2,75
Fundamentação teórica............................. 0,50       3,25
Materiais e métodos
 - Metodologia.................................... 0,25       3,50
 - Discussão das principais partes de código...... 0,25       3,75
 - Roteiro detalhado de pacotes................... 0,25       4,00
 - Roteiro detalhado de instalação................ 0,25       4,25
Resultados
 - DOM............................................ 0,25       4,50
 - Padrão MVC..................................... 0,25       4,75
 - Discussão dos resultados obtidos............... 0,50       5,25
 - Discussão sobre aspectos de segurança
   - Testes de vulnerabilidade/intrusão........... 0,25       5,50
   - Soluções de segurança........................ 0,25       5,75
Conclusão(ões).................................... 0,50       6,25
Referências....................................... 0,50       6,75
Apêndice/Anexo
 - Código completo (decorados/numerados: listings) 0,50       7,25
 - Link de repositório (GitHub)................... 0,25       7,50
PDF (objeto do LATEX
: grupo#_te.pdf).............. 0,50       8,00
Código-fonte LATEX
 (grupo#_te_latex.zip).......... 0,50       8,50
Endereço do projeto em server HTML/CSS/JS (24/7)
 - Escreva o endereço (URL/link) na tarefa EP..... 0,50       9,00
Código-fonte do projeto (grupo#_deploy.zip)....... 1,00      10,00

7. Entrega
O Projeto Web (PW) é composto por duas partes: a escrita e apresentação, i.e., EP e AP, cujos percentuais de ambos os itens de nota correspondem a 20% da Nota Final (NF).

Postagem: até 25/11/2025 [20:20]
EP: três arquivos e escrever o endereço (URL do VPS-UFSC) do projeto em server na área de texto da tarefa.
PDF (objeto do LATEX
).
Nome do arquivo:
grupo#_te.pdf,
e.g., grupo1_te.pdf.
Códigos-fontes (sources) do LATEX
 compactado (zip).
Nome do arquivo:
grupo#_te_latex.zip,
e.g., grupo1__te_latex.zip.
Códigos-fontes da implementação (compactado em zip).
Nome do arquivo:
grupo#_deploy.zip,
e.g., grupo1_deploy.zip.
Link para o repositório.
O repositório deverá ter a documentação do projeto (ao menos um arquivo README.md explicando a aplicação, como contribuir, etc.).
Endereço (URL/link) para a aplicação executando em um servidor (pode ser o servidor da UFSC), conforme explicado nos requisitos da aplicação.
Indique na parte escrita e no campo de texto da tarefa EP.
AP: um arquivo e escrever o endereço (URL do VPS-UFSC) da apresentação em server na área de texto da tarefa.
Website compactado.
Nome do arquivo:
grupo#_ap.zip,
e.g., grupo1_ap.zip.
Link para a apresentação executando no server VPS-UFSC, conforme requisitos da aplicação web.
Indique no campo de texto da tarefa AP.
8. FAQ
Tenho outra ideia de projeto, mas não cumpre com os requisitos da aplicação web. Ainda assim, posso fazer?
Converse com o professor para verificar se sua ideia de projeto pode ser feita como projeto da disciplina.

Não quero fazer o projeto em equipe. Posso fazer sozinho?
Preferencialmente não. Apenas em casos muito específicos será permitido.