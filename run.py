#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
IWF GOAT ANALYTICS SYSTEM - APPLICATION BOOTSTRAPPER (run.py)
架构职责：动态端口嗅探、多线程HTTP服务装配与浏览器自动挂载
================================================================================
"""

import os
import sys
import socket
import socketserver
import threading
import webbrowser

# 确保在任意工作目录下执行时都能正确寻址根目录模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from web.server import GOATRequestHandler


def find_available_port(start_port: int = 8899, max_attempts: int = 50) -> int:
    """动态探测本地空闲端口，避免与常见本地服务冲突"""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port


def main():
    port = find_available_port(8899)
    server_address = ('127.0.0.1', port)
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.ThreadingTCPServer(server_address, GOATRequestHandler) as httpd:
        url = f"http://127.0.0.1:{port}"
        print("=" * 80)
        print(" [IWF All-Time Weightlifting GOAT Analytics System - Open Source Modular Edition]")
        print(f" > Access Endpoint: {url}")
        print(" > Data Core: Historical data mounted (data/athletes.json)")
        print(" > Algorithm Engine: Logarithmic diminishing marginal WR smoothing model activated (engine/calculator.py)")
        print(" > Frontend Terminal: Dark tech cockpit ready (web/static/)")
        print(" > Launching default browser automatically...")
        print(" > Press Ctrl + C to terminate service")
        print("=" * 80)

        # 延时唤起浏览器，确保端口监听完全就绪
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] Exit signal received, service terminated gracefully.")
            httpd.server_close()
            sys.exit(0)


if __name__ == '__main__':
    main()