#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
web/server.py
职责：提供 GOATRequestHandler 供 run.py 调度；
      从 data/ 实时动态加载 JSON，并调用 engine/ 核心非线性量化引擎
"""

import http.server
import socketserver
import json
import os
import sys
import socket
import webbrowser
import threading

# 路径定位：将项目根目录加入 sys.path，保证可以无缝导入 engine 模块
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

DATA_DIR = os.path.join(BASE_DIR, "data")
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# 引入系统真理源：计算引擎与默认权重
from engine.calculator import calculate_goat_rankings, load_athletes
from engine.config import DEFAULT_WEIGHTS

class GOATRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        if directory is None:
            directory = STATIC_DIR
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format, *args):
        return

    def do_GET(self):
        if self.path == "/api/athletes":
            try:
                # 严格调用 engine/ 边际递减量化核心
                data = calculate_goat_rankings()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/calculate":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len)
            try:
                weights = json.loads(body.decode("utf-8"))
                # 动态滑块权重实时注入 engine 边际递减核心
                data = calculate_goat_rankings(weights=weights)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

# 兼容别名
DataRequestHandler = GOATRequestHandler

def run_server(port=8899):
    for p in range(port, port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", p)) != 0:
                port = p
                break
                
    server_address = ("127.0.0.1", port)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(server_address, GOATRequestHandler) as httpd:
        url = f"http://127.0.0.1:{port}"
        print(f"[IWF Server] 启动成功: {url}")
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[IWF Server] 服务已退出。")
            httpd.server_close()

if __name__ == "__main__":
    run_server()