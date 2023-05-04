#!/bin/bash
#This Shell script will be loaded in userData of EC2 instance

cd /home/ec2-user
mkdir PyServer
cd PyServer

echo 'from http.server import BaseHTTPRequestHandler, HTTPServer' >> pyserver.py
echo 'import time' >> pyserver.py

echo 'hostName = "localhost"' >> pyserver.py
echo 'serverPort = 80' >> pyserver.py

echo 'class MyServer(BaseHTTPRequestHandler):' >> pyserver.py
echo '    def do_GET(self):' >> pyserver.py
echo '        self.send_response(200)' >> pyserver.py
echo '        self.send_header("Content-type", "text/html")' >> pyserver.py
echo '        self.end_headers()' >> pyserver.py
echo '        self.wfile.write(bytes("<html><head><title>TCS-Apple Assignment for Monte</title></head>\\n", "utf-8"))' >> pyserver.py
echo '        self.wfile.write(bytes("<p>Request: %s</p>\\n" % self.path, "utf-8"))' >> pyserver.py
echo '        self.wfile.write(bytes("<body>\\n", "utf-8"))' >> pyserver.py
echo '        self.wfile.write(bytes("<h1>TCS-Apple Assignment for Monte</h1>\\n", "utf-8"))' >> pyserver.py
echo '        self.wfile.write(bytes("<p>This is an example web server. created by Monte Albert for TCS Apple assignment</p>\\n", "utf-8"))' >> pyserver.py
echo '        self.wfile.write(bytes("<p>Hostname is $(hostname -f)</p>\\n", "utf-8"))' >> pyserver.py
echo '        self.wfile.write(bytes("</body></html>\\n", "utf-8"))' >> pyserver.py

echo 'if __name__ == "__main__":        ' >> pyserver.py
echo '    webServer = HTTPServer((hostName, serverPort), MyServer)' >> pyserver.py
echo '    print("Server started http://%s:%s" % (hostName, serverPort))' >> pyserver.py

echo '    try:' >> pyserver.py
echo '        webServer.serve_forever()' >> pyserver.py
echo '    except KeyboardInterrupt:' >> pyserver.py
echo '        pass' >> pyserver.py

echo '    webServer.server_close()' >> pyserver.py
echo '    print("Server stopped.")' >> pyserver.py

yum install python37 python37-virtualenv python37-pip -y
python3 pyserver.py
