# -*- coding: utf-8 -*-
"""
[004] 해외영업 Order Process SOP 로컬 경량 웹서버 구동기
- 루트 디렉터리 기준 서빙
- http://localhost:8080 접속 시 index.html 즉시 로드
"""
import http.server
import socketserver
import os
import sys

PORT = 8080
# 프로젝트 루트 디렉터리
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def do_GET(self):
        # 루트 접속 시 index.html로 리다이렉트 또는 서빙
        if self.path == "/" or self.path == "":
            self.path = "/index.html"
        return super().do_GET()

def main():
    os.chdir(ROOT_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        httpd = socketserver.TCPServer(("", PORT), CustomHandler)
    except OSError:
        # 포트 8080이 이미 사용 중이면 8000 시도
        alt_port = 8000
        httpd = socketserver.TCPServer(("", alt_port), CustomHandler)
        print(f"포트 {PORT} 사용 중으로 {alt_port} 포트로 가동합니다.")

    print(f"🚀 로컬 서버 가동 완료: http://localhost:{httpd.server_address[1]}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버 종료.")
        sys.exit(0)

if __name__ == "__main__":
    main()
