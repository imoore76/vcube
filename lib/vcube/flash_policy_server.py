
import SocketServer, threading


flash_policy = """
<cross-domain-policy>
     <allow-access-from domain="*" to-ports="*" />
</cross-domain-policy> 
"""

"""
    Flash policy request
"""
class PolicyRequestHandler(SocketServer.BaseRequestHandler):

    def handle(self):        
        self.request.sendall(flash_policy)

"""
    Flash policy server
"""
class FlashPolicyServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    allow_reuse_address = True
        

server_thread = None
server = None

def start(ip="0.0.0.0",port=8843):
    
    global server_thread, server
    
    # Port 0 means to select an arbitrary unused port
    server = FlashPolicyServer((ip, port), PolicyRequestHandler)
    
    # Start a thread with the server -- that thread will then start one
    # more thread for each request
    server_thread = threading.Thread(target=server.serve_forever)
    
    server_thread.start()

def stop():
    
    global server_thread, server
    
    if server_thread is None: return

    server.shutdown()
    if server_thread is not None:
        server_thread.join()
        
    server_thread = None
