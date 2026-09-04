#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
IWF GOAT ANALYTICS SYSTEM - WEB SERVER & ROUTING LAYER
架构职责：基于标准库的静态资产托管与 /api/calculate、/api/athletes 路由分发
================================================================================
"""

import http.server
import json
import os
from pathlib import Path
from typing import Tuple

from engine.calculator import calculate_goat_rankings, load_athletes

STATIC_DIR = Path(__file__).resolve().parent / "static"


class GOATRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义静态资源与 RESTful API 请求处理器"""

    def __init__(self, *args, **kwargs):
        # 将静态资源根目录锁定至 web/static/
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def log_message(self, format, *args):
        """屏蔽默认请求刷屏日志，保持控制台整洁"""
        return

    def do_GET(self):
        """处理只读请求：静态页面与全量运动员初次加载"""
        if self.path == "/api/athletes":
            self._send_json(200, calculate_goat_rankings())
        else:
            super().do_GET()

    def do_POST(self):
        """处理动态计算请求：接收自定义滑动条权重并即时计算返回"""
        if self.path == "/api/calculate":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                custom_weights = json.loads(post_body.decode("utf-8"))
                rankings = calculate_goat_rankings(weights=custom_weights)
                self._send_json(200, rankings)
            except Exception as err:
                self._send_json(400, {"error": str(err)})
        else:
            self.send_response(404)
            self.end_headers()

    def _send_json(self, status_code: int, data: object):
        """标准化发送 JSON 响应头与 UTF-8 编码数据"""
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
