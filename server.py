import sys, os, signal, pprint, traceback

import json
import threading
import ConfigParser

# Our library modules
basepath = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0,basepath+'/lib')

import cherrypy

import vcube
from vcube import flash_policy_server, install

import logging, logging.config
logging.config.fileConfig("logging.conf")
logger = logging.getLogger(__name__)

"""
       
    Web Server Thread starts cherrypy
       
"""
class WebServerThread(threading.Thread):
               
    def finish(self):
        cherrypy.engine.exit()

    def run(self):
        
        from mysqlsession import MySQLSession
        import vcube
        
        config = vcube.getConfig()
        
        dbconfig = {}
        for k,v in config.items('storage'):
            dbconfig[k] = v
        
        webconfig = {
            'global' : {
                'server.thread_pool' : 30,
            },
            '/': {
                  
                
                'tools.staticdir.on': True,
                'tools.staticdir.dir': basepath+'/webroot',                                                                                       
                'tools.staticdir.index': 'index.html',
                                 
                'tools.sessions.on': True,
                'tools.sessions.storage_type': "Mysql",
                'tools.sessions.connect_arguments': dbconfig,
                'tools.sessions.table_name': 'sessions'
            }
        }
        
        """
            All requests go through dispatchers in the /dispatchers folder 
        """
        class DispatchRoot(object):
            def eventStream(self):
                pass
            eventStream.exposed = True
        
        # Load dispatchers
        import vcube.dispatchers
        
        
        logger.debug("Loading dispatchers")
        for d in vcube.dispatchers.__all__:
            __import__('vcube.dispatchers.' + d)
            setattr(DispatchRoot, d, getattr(vcube.dispatchers, d).dispatcher())
            
        """
            WebSocket server
        """
        from ws4py.server.cherrypyserver import WebSocketPlugin, WebSocketTool
        from ws4py.websocket import WebSocket

        WebSocketPlugin(cherrypy.engine).subscribe()
        cherrypy.tools.websocket = WebSocketTool()
        
        webconfig['/eventStream']  = {
            'tools.websocket.on': True,
            'tools.websocket.heartbeat_freq' : 30
        }


        """
            Start server
        """
        cherrypy.quickstart(DispatchRoot(), '/', webconfig)

        cherrypy.engine.autoreload.unsubscribe()


    
    
def main(argv = sys.argv):
    
    # For proper UTF-8 encoding / decoding
    #reload(sys)
    #sys.setdefaultencoding('utf8')
        
    if len(argv) > 1 and argv[1] == 'installdb':
        install.database(config)
        sys.exit()
        
    if len(argv) > 1 and argv[1] == 'resetadmin':
        install.resetadmin(config)
        sys.exit()
    
    def pumpEvent(event):
        cherrypy.engine.publish('websocket-broadcast', json.dumps(event))


    # Start application
    try:
        vcube.start()
        vcube.getInstance().addEventHandler(pumpEvent)
    except Exception as e:
        print "Error starting vCube: %s" %(e,)
        traceback.print_exc()
        return
        
    


    # Flash policy server to allow flash
    try:
        flash_policy_server.start()
    except Exception as e:
        print "Error starting Flash Policy Server: %s" %(e,)
        traceback.print_exc()
        vcube.stop()
        return

    def cleanup():
    
        vcube.stop()
        flash_policy_server.stop()


    cherrypy.engine.subscribe('stop', cleanup)
    
    # Start web thread
    try:
        webserver = WebServerThread()    
        webserver.start()
    except Exception as e:
        print "Error starting Web Server: %s" %(e,)
        traceback.print_exc()
        cleanup()
        return

    
    import signal
    def stop_sigint(signal, frame):
        logger.debug("SIGINT received")
        cleanup()
    signal.signal(signal.SIGINT, stop_sigint)



if __name__ == '__main__':
    main(sys.argv)

