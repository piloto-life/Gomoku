#!/usr/bin/python3
# -*- coding: utf-8 -*-

import cgi
import json
import os
import subprocess
import sys
import signal

# --- Configuração ---
SERVER_SCRIPT_PATH = "/var/www/html/AA/AA11/py/combined_server.py" 
PID_FILE = "/tmp/monitor_server_AA11.pid"
# --------------------

def print_json_response(data):
    print("Content-Type: application/json")
    print("Access-Control-Allow-Origin: *")
    print("Access-Control-Allow-Methods: POST, OPTIONS")
    print("Access-Control-Allow-Headers: Content-Type")
    print()
    print(json.dumps(data))
    sys.stdout.flush()

def get_server_status():
    if not os.path.exists(PID_FILE):
        return 'stopped', None
    
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
    except ValueError:
        os.remove(PID_FILE)
        return 'stopped', None

    try:
        os.kill(pid, 0)
    except OSError:
        os.remove(PID_FILE)
        return 'stopped', None
    else:
        return 'running', pid

def start_server():
    status, pid = get_server_status()
    if status == 'running':
        return {'status': 'running', 'message': 'Servidor já está em execução.', 'pid': pid}
    
    try:
        process = subprocess.Popen(
            ['nohup', 'python3', SERVER_SCRIPT_PATH],
            stdout=open(os.devnull, 'w'),
            stderr=open(os.devnull, 'w'),
            preexec_fn=os.setpgrp
        )
        
        with open(PID_FILE, 'w') as f:
            f.write(str(process.pid))
            
        return {'status': 'started', 'message': 'Servidor iniciado.', 'pid': process.pid}
    except Exception as e:
        return {'status': 'error', 'message': f'Erro ao iniciar servidor: {str(e)}'}

def stop_server():
    status, pid = get_server_status()
    if status == 'stopped':
        return {'status': 'stopped', 'message': 'Servidor já estava parado.'}
    
    try:
        os.kill(pid, signal.SIGTERM)
        try:
            os.remove(PID_FILE)
        except OSError:
            pass
        return {'status': 'stopped', 'message': 'Servidor parado.', 'pid': pid}
    except Exception as e:
        return {'status': 'error', 'message': f'Erro ao parar servidor: {str(e)}'}

def main():
    if os.environ.get('REQUEST_METHOD') == 'OPTIONS':
        print_json_response({})
        return

    try:
        raw_data = sys.stdin.read()
        if not raw_data:
            data = {'action': 'status'}
        else:
            data = json.loads(raw_data)
        
        action = data.get('action')

        if action == 'start':
            response = start_server()
        elif action == 'stop':
            response = stop_server()
        elif action == 'status':
            status, pid = get_server_status()
            response = {'status': status, 'pid': pid}
        else:
            response = {'status': 'error', 'message': 'Ação desconhecida.'}
            
    except json.JSONDecodeError:
        response = {'status': 'error', 'message': 'Erro ao decodificar JSON da requisição.'}
    except Exception as e:
        response = {'status': 'error', 'message': f'Erro inesperado no gerenciador: {str(e)}'}

    print_json_response(response)

if __name__ == "__main__":
    main()