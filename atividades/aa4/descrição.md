1. Sobre a prática
O objetivo desta prática é o deploy da webpage do Projeto Web (implementada na atividade AA2) no serviço VPS (Virtual Private Server) da UFSC.

Fora da rede institucional o acesso deverá ser realizado por meio de VPN (Virtual Private Network) da UFSC. O envio de arquivos poderá ser realizado por meio de SCP (Secure Copy Protocol) ou sFTP (secure File Transfer Protocol). Há vários clientes SFTP, dentre os quais destaca-se o FileZilla. Por fim, é possível instalar a extensão ms-vscode-remote.vscode-remote-extensionpack no VSCode para edição remota via SSH (Secure Shell Protocol).

Seguir para...

2. Criação de espaço no VPS UFSC
Acesse o idUFSC (idufsc.ufsc.br/cloud/vps) e siga os passos a seguir.



Clique na aba Nuvem.
Clique na aba Servidores Virtuais.
Em Meus Servidores Virtuais, clique em Criar servidor.

Preencha o nome do servidor.
O espaço disponível será de 3 GB de armazenamento com 1 GB de RAM.
Escolha a distro Linux.
Recomenda-se o default.
Selecione o tempo de disponibilização do servidor.
Clique em Criar para que o espaço seja disponibilizado no VPS.
Após a disponibilização do espaço no VPS, em Controles, clique no ícone play para iniciar o servidor.
Fique atento à senha gerada, a qual será usada para o upload de arquivos.


3. Instalação, Configuração & Deploy
Nesta seção são apresentados a instalação, configuração e deploy local e remoto. Em especial, considera-se o server VPS-UFSC como remoto. Restrições do VPS-UFSC:

Acesso fora da redeUFSC deve ser realizado por VPN-UFSC.
Tanto no acesso para instalação e configuração (SSH) quanto a renderização de conteúdo (HTTP/HTTPS).

Todas as portas do server estão fechadas.
Por esse motivo, a renderização do conteúdo no server HTTP/HTTPS fora da redeUFSC deverá ser realizada por meio do VPN-UFSC.
Na redeUFSC ou por VPN-UFSC, estas são as portas abertas (por default):
[VPN-UFSC]
$ sudo nmap -sS -Pn -p- name_server.idUFSC.vms.ufsc.br
Starting Nmap 7.80 ( https://nmap.org ) at 2025-05-23 14:36 -03
Nmap scan report for name_server.idUFSC.vms.ufsc.br (150.162.244.xx)
Host is up (0.00080s latency).
Other addresses for name_server.idUFSC.vms.ufsc.br (not scanned): 2801:84:0:1240::xxx
rDNS record for 150.162.244.xx: usr244-xx.vpn.ufsc.br
Not shown: 65525 closed ports
PORT    STATE    SERVICE
22/tcp  open     ssh
53/tcp  filtered domain
80/tcp  open     http
135/tcp filtered msrpc
136/tcp filtered profile
137/tcp filtered netbios-ns
138/tcp filtered netbios-dgm
139/tcp filtered netbios-ssn
443/tcp open     https
445/tcp filtered microsoft-ds
Nmap done: 1 IP address (1 host up) scanned in 11.12 seconds

Fora da redeUFSC, o mesmo comando de mapeamento, reage diferente:
[Externo à redeUFSC]
$ sudo nmap -sS -Pn -p- name_server.idUFSC.vms.ufsc.br
Starting Nmap 7.95 ( https://nmap.org ) at 2025-05-23 14:45 -03
Nmap scan report for name_server.idUFSC.vms.ufsc.br (150.162.244.xx)
Host is up (0.0065s latency).
Other addresses for name_server.idUFSC.vms.ufsc.br (not scanned): 2801:84:0:1240::xxx
rDNS record for 150.162.244.xx: usr244-xx.vpn.ufsc.br
Not shown: 65534 filtered tcp ports (no-response)
PORT    STATE  SERVICE
113/tcp closed ident
Nmap done: 1 IP address (1 host up) scanned in 109.50 seconds

Logo, não é possível usar o certbot para implementar SSL/TLS (com Let's Encript, por exemplo).
Foi solicitado à SeTIC um certificado para fins educacionais. Entretanto, tal solicitação foi recusada por motivos de segurança.
Portanto, implemente SSL/TLS autoassinado.
Seguir para...


3.1. Local [implementado na atividade AA2, não faz parte desta atividade]
Pacotes necessários (em distro baseada no Debian):

$ sudo apt install xterm npm php
$ sudo npm install --global http-server
Python 3
$ python3 -m http.server 8080 --bind 127.0.0.1 | firefox 127.0.0.1:8080/index.html
$ xterm -geometry 110x10 -e python3 -m http.server 8080 --bind 127.0.0.1 | firefox 127.0.0.1:8080/index.html
Script para habilitar CORS:
 Exibir/Ocultar
PHP/Apache
$ php -S 127.0.0.1:8080 | firefox 127.0.0.1:8080/index.html
$ xterm -geometry 110x10 -e php -S 127.0.0.1:8080 | firefox 127.0.0.1:8080/index.html
Desabilitar Apache 2
$ sudo update-rc.d apache2 disable
Desabilitar no boot
$ sudo update-rc.d -f apache2 remove
Alternativamente pode-se desabilitar no boot com
$ sudo systemctl status apache2
$ sudo systemctl is-enabled apache2
$ sudo systemctl disable apache2
$ sudo systemctl stop apache2
$ sudo systemctl mask apache2
Habilitar Apache 2
$ sudo update-rc.d apache2 enable
HTTP-Server
$ http-server -a 127.0.0.1 -p 8080 -c86400 --cors | firefox 127.0.0.1:8080/index.html
$ xterm -geometry 110x10 -e http-server -a 127.0.0.1 -p 8080 -c86400 --cors | firefox 127.0.0.1:8080/index.html
Opções:
-c86400: cache para arquivos estáticos, se 86400s = 24h.
--cors: Cross-Origin Resource Sharing (Compartilhamento de Recursos Entre Origens).
Permite requisições de diferentes origens (domínios, portas, protocolos).
Seguir para...



3.2. Remoto
Após criar o espaço no VPS, suponha que os dados sejam, por exemplo:
name_server: ine5646
fixed_url: .idUFSC.vms.ufsc.br
∴ endereço: name_server.fixed_url
Exemplo:
ine5646.idUFSC.vms.ufsc.br
idUFSC é o usuário do idUFSC.

Caso não tenha "ligado" o servidor, acesse os Controles.
Clique no ícone play (►) para disponibilizar o server no endereço do item (1).

Quando o servidor estiver disponível, conecte-se ao VPN-UFSC (se estiver fora da redeUFSC) e acesse o server por SSH, via terminal (e.g., Linux).
ssh idUFSC@name_server.idUFSC.vms.ufsc.br -4XC
Considerando o exemplo do item (1):
ssh ine5646.idUFSC.vms.ufsc.br -4XC
Entre com a senha do VPS (não é a do idUFSC).
O parâmetro -4 habilita o tunneling por IPv4.
O acesso fora da redeUFSC por VPN deve ser realizado apenas por meio do IPv4.

Agora faça a instalação e configuração do servidor Linux (Apache2).
sudo apt update

sudo apt install apache2 apache2-utils vim

sudo usermod -a -G $USER www-data
    # em que $USER é o seu idUFSC, ou seja o espaço do usuário no VPS, se digitar pwd, verá /home/<idUFSC> ou echo $USER.

# Permissão recursiva (UGO: user, group, others)
sudo chmod 755 -R /var/www/html/

cd ~
ln -s /var/www/html/ html
cd /var/www
sudo chown $USER:$USER -R html
sudo a2enmod ssl
sudo a2ensite default-ssl

# Edite o arquivo /etc/apache2/sites-available/000-default.conf com o Vim (ou outro editor), e.g.,
sudo vim /etc/apache2/sites-available/000-default.conf

# Adicione o trecho
<Directory /var/www/html>
    AllowOverride All
    Require all granted
</Directory>
# Salve as alterações e saia da edição

sudo a2enmod rewrite
sudo a2enmod headers

# Reinicie o Apache2
sudo systemctl stop apache2
sudo systemctl start apache2
sudo systemctl restart apache2
sudo systemctl reload apache2

Como as portas do VPS-UFSC estão fechadas, não é possível implementar SSL/TLS com autoridades certificadoras, e.g., Let's Encript. Portanto, implemente o SSL/TLS para HTTPS com certificado autoassinado.

cd /var/www

sudo mkdir /etc/apache2/ssl

sudo a2enmod ssl
sudo a2enmod headers
sudo systemctl restart apache2

# Em caso de falha ao reiniciar o apache2:
    # Failed to restart apache2.service: Unit apache2.service is masked.
    sudo systemctl unmask apache2
    sudo systemctl restart apache2

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/apache2/ssl/apache.key -out /etc/apache2/ssl/apache.crt

# Preencha os dados, e.g.,
BR
Santa Catarina
Florianopolis
UFSC
INE/UFSC
name_server.idUFSC.vms.ufsc.br
email

# Execute o comando a seguir:
echo '<VirtualHost *:80>
    ServerAdmin email
    ServerName name_server.idUFSC.vms.ufsc.br
    ServerAlias www.name_server.idUFSC.vms.ufsc.br
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options FollowSymlinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>' | sudo tee /etc/apache2/sites-available/000-default.conf > /dev/null

# Agora, execute o comando a seguir:
echo '<IfModule mod_ssl.c>
    <VirtualHost _default_:443>
        ServerAdmin email
        ServerName name_server.idUFSC.vms.ufsc.br
        ServerAlias www.name_server.idUFSC.vms.ufsc.br
        DocumentRoot /var/www/html

        <Directory /var/www/html>
            Options FollowSymlinks
            AllowOverride All
            Require all granted
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        # Habilita SSL
        SSLEngine on
        # Caminho do certificado autossinado
        SSLCertificateFile /etc/apache2/ssl/apache.crt
        # Caminho da chave privada
        SSLCertificateKeyFile /etc/apache2/ssl/apache.key

        <FilesMatch "\.(?:cgi|shtml|phtml|php)$">
            SSLOptions +StdEnvVars
        </FilesMatch>
        <Directory /usr/lib/cgi-bin>
            SSLOptions +StdEnvVars
        </Directory>

        # CORS e Segurança
        Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
        Header always set Access-Control-Allow-Origin "https://name_server.idUFSC.vms.ufsc.br"
        Header always set Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT"
        Header always set Access-Control-Allow-Headers "X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding"

    </VirtualHost>
</IfModule>' | sudo tee /etc/apache2/sites-available/default-ssl.conf > /dev/null

# Na sequência, exeute os comandos a seguir:
sudo apache2ctl configtest # confira o retorno.

sudo chmod 644 /etc/apache2/ssl/apache.crt
sudo chmod 600 /etc/apache2/ssl/apache.key

sudo chown root:root /etc/apache2/ssl/apache.crt
sudo chown root:root /etc/apache2/ssl/apache.ke

# Para habilitar SSL/TLS:
sudo a2ensite default-ssl.conf
sudo systemctl stop apache2
sudo systemctl start apache2
sudo systemctl reload apache2
sudo systemctl restart apache2

    # Caso queira desabilitar: SSL/TLS
    sudo a2dissite 000-default.conf
    sudo a2dissite default-ssl
    sudo systemctl reload apache2

# Verifique o status
sudo systemctl status apache2.service

Esta opção não está disponível no VPS-UFSC [apenas para efeito didático].
# Instale certbot (Let's Encrypt).

sudo apt install certbot python3-certbot-apache

Considere name_server.idUFSC.vms.ufsc.br, e.g., ine5646.idUFSC.vms.ufsc.br:
echo '<VirtualHost *:80>
    ServerName ine5646.idUFSC.vms.ufsc.br
    ServerAlias www.ine5646.idUFSC.vms.ufsc.br
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options FollowSymlinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/ine5646.log
    CustomLog ${APACHE_LOG_DIR}/ine5646.log combined

    RewriteEngine On
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>' | sudo tee /etc/apache2/sites-available/ine5646.idUFSC.vms.ufsc.br.conf > /dev/null

# Configurações adicionais:
sudo a2dissite 000-default

sudo a2ensite ine5646.idUFSC.vms.ufsc.br.conf

sudo a2enmod rewrite

sudo systemctl restart apache2.service

sudo apache2ctl configtest
    # Confira se retorna: Syntax OK

# Habilitando o certificado
sudo certbot --apache

        Saving debug log to /var/log/letsencrypt/letsencrypt.log
        
        Which names would you like to activate HTTPS for?
        We recommend selecting either all domains, or all domains in a VirtualHost/server block.
        - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        1: ine5646.idUFSC.vms.ufsc.br
        2: www.ine5646.idUFSC.vms.ufsc.br
        - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        Select the appropriate numbers separated by commas and/or spaces, or leave input
        blank to select all options shown (Enter 'c' to cancel): 1
        Requesting a certificate for ine5646.idUFSC.vms.ufsc.br

        Successfully received certificate.
        Certificate is saved at: /etc/letsencrypt/live/ine5646.idUFSC.vms.ufsc.br/fullchain.pem
        Key is saved at:         /etc/letsencrypt/live/ine5646.idUFSC.vms.ufsc.br/privkey.pem
        This certificate expires on 2025-08-04.
        These files will be updated when the certificate renews.
        Certbot has set up a scheduled task to automatically renew this certificate in the background.
        
        Deploying certificate
        Successfully deployed certificate for ine5646.idUFSC.vms.ufsc.br to /etc/apache2/sites-available/ine5646.idUFSC.vms.ufsc.br-le-        ssl.conf
        Congratulations! You have successfully enabled HTTPS on https://ine5646.idUFSC.vms.ufsc.br

        - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        If you like Certbot, please consider supporting our work by:
         * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
         * Donating to EFF:                    https://eff.org/donate-le
        - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Desabilitando default-ssl:
sudo a2dissite default-ssl

# Reinicie o Apache2
sudo systemctl reload apache2

# Cheque a frequência de atualização do certificado
sudo systemctl status certbot.timer
certbot.timer - Run certbot twice daily
     Loaded: loaded (/usr/lib/systemd/system/certbot.timer; enabled; preset: enabled)
     Active: active (waiting) since Tue 2025-05-06 16:04:15 UTC; 41min ago
    Trigger: Wed 2025-05-07 02:46:54 UTC; 10h left
   Triggers: ● certbot.service

May 06 16:04:15 ine5646.idUFSC.vms.ufsc.br systemd[1]: Started certbot.timer - Run certbot twice daily.

echo | openssl s_client -connect ine5646.idUFSC.vms.ufsc.br:443 -servername ine5646.idUFSC.vms.ufsc.br |
openssl x509 -noout -issuer -subject -dates

depth=2 C = US, O = Internet Security Research Group, CN = ISRG Root X1
verify return:1
depth=1 C = US, O = Let's Encrypt, CN = E6
verify return:1
depth=0 CN = ine5646.idUFSC.vms.ufsc.br
verify return:1
DONE
issuer=C = US, O = Let's Encrypt, CN = E6
subject=CN = ine5646.idUFSC.vms.ufsc.br
notBefore=May  6 15:45:34 2025 GMT
notAfter=Aug  4 15:45:33 2025 GMT

Neste caso, a frequência de atualização do certificado será de duas vezes ao dia.

Acesse o server pelo browser:
https://name_server.idUFSC.vms.ufsc.br, e.g.,
https://ine5646.idUFSC.vms.ufsc.br

Por default, o diretório em que a página está instalada é /var/www/html.
Logo, é neste diretório, caso seja mantida a configuração default, que deverá realizar o upload dos arquivos do website.

Conecte-se ao VPN-UFSC (se estiver fora da redeUFSC) para acessar o server por SFTP:
Host: name_server.idUFSC.vms.ufsc.br, e.g.,
Host: ine5646.idUFSC.vms.ufsc.br
usuário: idUFSC
senha: configurada no VPS (não é a do idUFSC)

Conecte-se ao VPN-UFSC (se estiver fora da redeUfsc) para realizar o upload de arquivos por SCP:
Na máquina local, vá no diretório que contém o website, e.g.,
cd /home/user/ine5646.
scp -4r * idUFSC@name_server.idUFSC.vms.ufsc.br:/var/www/html/, e.g.,
scp -4r * idUFSC@ine5646.idUFSC.vms.ufsc.br:/var/www/html/ # -r habilita o modo recursivo
senha: VPS (não é a do idUFSC)

# se quiser enviar diretórios/arquivos ocultos recursivamente:
scp -4r *.* idUFSC@ine5646.idUFSC.vms.ufsc.br:/var/www/html/
senha: VPS (não é a do idUFSC).

# note que o local para onde serão enviados os arquivos será
/var/www/html/

Acesse o endereço e cheque as alterações.


4. Tools Para Deploy
O upload dos arquivos para o server pode ser realizada de várias formas. A seguir são descritas algumas maneiras de realizar o upload dos arquivos para o server. Em especial, para o VPS UFSC.


4.1. VPN
Fora da rede instucional da UFSC, o acesso ao VPS pode ser realizado por meio do VPN UFSC. Instruções sobre o serviço estão disponíveis em https://setic.ufsc.br/servicos/acesso-a-redeufsc/servico-de-vpn-virtual-private-network.



4.2. SCP
Upload (cópia recursiva) de arquivos pelo protocolo SCP do diretório local para o diretório remoto (VPS). Como exemplo, considere a árvore de arquivos a seguir.

AA4
├── imgs
│   ├── logo_ufsc.jpg
│   └── autores.jpg
├── index.html
└── style.css

Para copiar o conteúdo do diretório local AA4 para um diretório remoto (AA4) pode ser realizado por meio do comando em Bash (Linux):

$ scp -4r AA4 user_idUFSC@espaço.user.sobrenome.vms.ufsc.br:/home/user.sobrenome/AA4/

A senha do usuário user.sobrenome no VPS espaço.user.sobrenome.vms.ufsc.br será requerida e após a autenticação será realizada a cópia recursiva (diretório, subdiretórios e arquivos).




4.3. FileZilla
O FileZilla é um cliente sFTP com interface gráfica. Após configurar e acessar o diretório remoto, a estrutura de arquivos e diretórios estará disponível do lado direito da janela, enquanto que a estrutura de arquivos e diretórios locais estará do lado esquerdo. O seu uso é intuitivo, bastando selecionar os arquivos (ou diretórios) do lado esquerdo (local), clicar com o botão direito do mouse e clicar no ícone de upload (primeira opção). Alternativamente, após a seleção dos arquivos (ou diretórios), clique com o mouse no botão esquerdo e arraste para o lado direito (lado do server ou remoto).

Configuração do cliente FileZilla fora da rede institucional da UFSC para acesso ao VPS-UFSC, caso não consiga acessar pelo URL do server VPS-UFSC, sugere-se forçar a configuração com IPv4, conforme segue.

Conecte-se ao VPN-UFSC (caso esteja fora da redeUFSC).


Em um terminal descubra o IP do server VPS para o qual deseja conectar-se, e.g., host wss.wyllian.bs.vms.ufsc.br

No que o endereço IPv4 retornado é 150.162.244.8.

Abra o Gerenciador de Sites (clique no íncone indicado no mouse).


Siga os passos indicados a seguir para cadastrar o site. Aqui foi usado o exemplo wss.wyllian.bs.vms.ufsc.br. Use o endereço IPv4 obtido pelo comando host para configurar a conexão no FileZilla. Entre com o seu idUFSC e senha.


Clique na aba "Avançado" e selecione "Contornar o proxy" e clique em "OK".


Ao lado do ícone do Gerenciador de Sites, clique no ícone de seleção (seta para baixo) e selecione o site cadastrado.

Caso seja solicitada alguma ação para aceitar chave SSH/SHA256, selecione a opção "Always trust this host, add this key to the cache" clique em "OK" para armazenar a chave.

Caso a autenticação seja bem-sucedida, a conexão serão estabelecida com server VPS-UFSC.


Agora, poderá realizar transferências de arquivos.

Material de consulta sobre sFTP:

How to connect to an sFTP Server
FileZilla Complete Tutorial with How sFTP Works



4.4. Edição no VSCode via SSH
É possivel executar o VSCode remotamente (por meio de uma instância local do VSCode para edição remota de código).

SSH Architecture

Com o VSCode instalado, siga os passos seguintes para instalar a extensão que permite isso:

Abra o VSCode.
Pressione CTRL+P
Cole o seguinte trecho na caixa de texto que abrir:
ext install ms-vscode-remote.vscode-remote-extensionpack
Pressione enter e aguarde a instalação da extensão.

Teste se o host remoto está ativo, criando uma sessão SSH. Após a instalação da extensão, siga os passos a seguir.

Ctrl+Shift+P.
Escreva:
add new
Selecione a opção Remote-SSH: Add New SSH Host...
Digite o comando ssh para conectar:
ssh -4 user@host
User e host são os mesmos do estabelecimento da conexão SSH (no teste do host remoto).
Selecione o local de armazenamento da configuração, e.g.,
~/.ssh/config
Na interface do VSCode, no canto inferior direito há um botão (verde) para iniciar a conexão.


Ao clicar, selecione no menu que abrir "Connect to Host..."
Selecione o host configurado (cadastrado). Depois de algum tempo a conexão deverá ser estabelecida (poderá ser solicitada senha se não for configurada uma chave para acesso).


Referência: https://code.visualstudio.com/docs/remote/ssh.

4.5. Dolphin
A seguir descreve-se os passos para habilitar o acesso ao VPS-UFSC pelo Dolphin (KDE Plasma) com o terminal Konsole. Configuração equivalente pode ser aplicada ao Nautilus.

Conecte-se ao VPN-UFSC.


Digite o endereço do server VPS-UFSC na barra de endereço. Caso tenha dificuldades com endereço do server, substitua o endereço do server pelo IPv4, conforme o template: sftp://idUFSC@IPv4/home/idUFSC.


Para fins de simplificação, este tutorial utilizará sftp://wss.wyllian.bs.vms.ufsc.br, cujo IPv4 é 150.162.244.8.

O IPv4 é obtido por meio do comando host no Konsole. Clique em "Conetar mesmo assim" para continuar. Para habilitar o Konsole digite F4.

Complete a autenticação, entre com a senha do server VPS-UFSC.


Atualize o Konsole (digite F4). A partir de agora, comandos no terminal (Konsole) poderão ser realizados remotamente (server VPS-UFSC).


Caso queira adicionar o atalho remoto clique sobre o ícone, conforme indica o mouse e arraste para a aba "Remoto".


Ao arrastar para a aba "Remoto" solte o ícone.


Clique com o botão direito do mouse sobre o ícone.


Digite um nome para o atalho e clique em "OK" para salvar a alteração.


A partir de agora, poderá acessar o endereço a partir do atalho adicionado em "Remoto".


Com o acesso ao server VPS-UFSC poderá transferir arquivos, deletar, editar etc. Entretanto, comandos de configuração e instalação não poderão ser realizados, mesmo usando o Konsole.
Instalação de pacotes e configuração do server deverão ser realizadas por SSH.
Seguir para...