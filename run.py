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
        print(" [IWF 举重全历史 GOAT 数据分析系统 - 开源模块化版本]")
        print(f" > 访问端点: {url}")
        print(" > 数据核心: 42 位殿堂级巨星库已挂载 (data/athletes.json)")
        print(" > 算法引擎: 对数边际递减世界纪录平抑模型已激活 (engine/calculator.py)")
        print(" > 前端终端: 深色科技驾驶舱已就绪 (web/static/)")
        print(" > 正在自动启动默认浏览器...")
        print(" > 按 Ctrl + C 终止服务")
        print("=" * 80)

        # 延时唤起浏览器，确保端口监听完全就绪
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] 接收到退出信号，服务优雅终止。")
            httpd.server_close()
            sys.exit(0)


if __name__ == '__main__':
    main()
