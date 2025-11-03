#!/usr/bin/env python3
"""
udp_client.py

Cliente UDP simples para testar o servidor da atividade AA11.

Uso:
    python3 udp_client.py <server_url> [mensagem]

Exemplo:
    python3 udp_client.py http://pw.alec.coelho.vms.ufsc.br/AA/AA11 "Olá UDP"

Se apenas a URL for informada, o script entra em modo interativo para enviar mensagens.
"""

import socket
import sys
from urllib.parse import urlparse

DEFAULT_PORT = 8081


def parse_host(url_or_host: str) -> str:
    if url_or_host.startswith(('http://', 'https://', 'ws://', 'wss://')):
        p = urlparse(url_or_host)
        return p.hostname
    return url_or_host


def send_once(host: str, port: int, message: str):
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.settimeout(3)
        addr = (host, port)
        print(f"Enviando para {host}:{port} ...")
        s.sendto(message.encode('utf-8'), addr)
        try:
            data, _ = s.recvfrom(4096)
            print('Resposta:', data.decode('utf-8', errors='ignore'))
        except socket.timeout:
            print('Sem resposta (timeout).')


def interactive_mode(host: str, port: int):
    print("Modo interativo (UDP). Digite mensagens (ou 'exit' para sair):")
    try:
        while True:
            msg = input('> ')
            if not msg:
                continue
            if msg.lower() in ('exit', 'quit'):
                print('Encerrando client.')
                break
            try:
                send_once(host, port, msg)
            except Exception as e:
                print('Erro ao enviar:', e)
    except (KeyboardInterrupt, EOFError):
        print('\nSaindo...')


def main():
    if len(sys.argv) >= 3:
        server = sys.argv[1]
        message = ' '.join(sys.argv[2:])
        host = parse_host(server)
        if not host:
            print('Host inválido:', server)
            sys.exit(1)
        send_once(host, DEFAULT_PORT, message)
    elif len(sys.argv) == 2:
        server = sys.argv[1]
        host = parse_host(server)
        if not host:
            print('Host inválido:', server)
            sys.exit(1)
        interactive_mode(host, DEFAULT_PORT)
    else:
        server = input('URL do servidor (ex: http://host/AA/AA11 ou ws://host:8082): ').strip()
        host = parse_host(server)
        if not host:
            print('Host inválido:', server)
            sys.exit(1)
        interactive_mode(host, DEFAULT_PORT)


if __name__ == '__main__':
    main()
