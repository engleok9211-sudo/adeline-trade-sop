# -*- coding: utf-8 -*-
"""
[004] 해외영업 Order Process SOP 로컬 경량 웹서버 구동기
- 루트 디렉터리 기준 서빙
- 가용 포트 자동 감지 (8080, 8000, 5500, 3000)
- 브라우저 자동 오픈 (http://localhost:PORT)
"""
import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time

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

    def end_headers(self):
        # 캐시 방지 헤더 (개발 및 로컬 실시간 반영용)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def open_browser(url):
    time.sleep(1.0)
    try:
        print(f"🌐 웹 브라우저를 자동 실행합니다: {url}", flush=True)
        webbrowser.open(url)
    except Exception as e:
        print(f"※ 브라우저 자동 실행 안내: 직접 {url} 로 접속해주세요.", flush=True)

def main():
    os.chdir(ROOT_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    
    ports = [8080, 8000, 5500, 3000, 8888]
    httpd = None
    selected_port = None

    for port in ports:
        try:
            httpd = socketserver.TCPServer(("", port), CustomHandler)
            selected_port = port
            break
        except OSError:
            continue

    if not httpd:
        httpd = socketserver.TCPServer(("", 0), CustomHandler)
        selected_port = httpd.server_address[1]

    server_url = f"http://localhost:{selected_port}"
    print("=" * 60, flush=True)
    print("  🚀 [아델라인 글로벌] 해외영업 Order Process SOP 로컬 웹서버", flush=True)
    print(f"  👉 브라우저 접속 주소: {server_url}", flush=True)
    print(f"  👉 프로젝트 루트 경로: {ROOT_DIR}", flush=True)
    print("  ※ 종료하려면 콘솔 창에서 Ctrl + C 를 누르세요.", flush=True)
    print("=" * 60, flush=True)

    # 브라우저 자동 열기 (별도 스레드)
    threading.Thread(target=open_browser, args=(server_url,), daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n로컬 웹서버가 종료되었습니다.")
        sys.exit(0)

if __name__ == "__main__":
    main()
