import threading, socket, sys, time, json, pprint, Queue
from urlparse import urlparse
import traceback

import logging
logger = logging.getLogger(__name__)
messageLogger = logging.getLogger(__name__ + '.messages')

import constants

class vboxRPCClientPool(threading.Thread):
    
    clients = []
    running = False
    
    
    def __init__(self, server, threads):
        
        for i in range(0,threads):
            
            c = vboxRPCClient(server=server, service='vbox')
            c.start()
            
            self.clients.append(c)
            
        threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,id(self)))
        
    def stop(self):
        
        self.running = False
                
        
    def vboxAction(self, action, args):

        startTime = time.time()
        
        a = 0
        for i in range(0,20):
            if not self.running: break
            for c in self.clients:
                if c.isAvailable():
                    response = c.rpcCall(action, args)
                    response['messages'].append("vboxClientPool(%s - %s) %s took %s seconds" %(a, len(self.clients), action, time.time()-startTime))
                    return response.copy()
                a = a + 1
                
            time.sleep(0.2)
            
        raise Exception("vboxRPCClientPool: no threads available to perform request")
                
    def run(self):
        
        self.running = True
        
        while self.running:
            time.sleep(1)
            
        for c in self.clients:
            c.stop()
            c.join()


            
class vboxRPCClient(threading.Thread):

    
    id = None
    server = None
    
    onStateChange = lambda a,b,c,d: None

    pollInterval = 0.2
    
    sock = None
    file = None
    
    connected = False
    running = False
    
    registered = False
    registerMessage = {}
    
    rpcRequestId = None
    rpcResponse = None
    rpcLock = None
    
    service = None
    
    listening = False
    listener = False
    listenFor = []
    
    state = -1
    
    connectionRetryInterval = 10
    
        
    def __init__(self, **kwargs):
        
        for k,v in kwargs.iteritems():
            if hasattr(self, k):
                setattr(self, k, v)
        
        self.id = self.server['id']
        
        # Initial state is disconnected
        self.setState(constants.CONNECTOR_STATES['DISCONNECTED'], '')
                
        threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,id(self)))
        
        self.rpcResponse = Queue.Queue(1)
        self.rpcLock = threading.Lock()
        
        
    def setState(self, state, message):
        
        if self.state == state: return
        
        self.state = state
        
        self.onStateChange(self.id, state, message)
        
    def connect(self):
        """
            Connect to server
        """
        
        try:
            url = urlparse(self.server['location'])
            
        except Exception as e:

            self.disconnect()            
            self.stop()

            # Error state
            self.setState(constants.CONNECTOR_STATES['ERROR'], "Failed to parse server location %s" %(self.server['location']))
            
            return
        

        try:
            
            logger.debug("Trying to connect...")
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((url.hostname, url.port))
            
            self.file = self.sock.makefile()
            self.connected = True
            
                
        except Exception as e:

            logger.error("%s %s" %(self.server['location'], str(e)))

            # Error state
            self.setState(constants.CONNECTOR_STATES['ERROR'], str(e))
            

    def register(self):
        
        self.setState(constants.CONNECTOR_STATES['REGISTERING'], '')
        
        """ Set service """
        self.sock.sendall(json.dumps(self.genRPCCallMsg('setService', {'service':self.service}))+"\n")
        
        response = self.waitResponse()
        if not response or not response.get('success', False):
            raise Exception("setService failed for vbox connector %s" %(self.server['name'],))

        if self.listener:
                        
            self.sock.sendall(json.dumps(self.genRPCCallMsg('registerClient',{}))+"\n")
            
            response = self.waitResponse()
            if not response or not response.get('success', False):
                raise Exception("registerClient failed for vbox connector %s" %(self.server['name'],))

        self.registered = True
        
    def disconnect(self):
        """ 
            Disconnect from server
        """
        try:
            if self.sock:
                try:
                    self.sock.close()
                except:
                    pass
            
            if self.file:
                try:
                    self.file._sock.close()
                except:
                    pass
                try:
                    self.file.close()
                except:
                    pass

        finally:       
            self.connected = False
            self.registered = False
            self.sock = None
            self.file = None
    
    
    def stop(self):
        """
            Stop running and disconnect
        """
        logger.debug("Stop requested")
        
        self.running = False
        self.disconnect()
        
        self.setState(constants.CONNECTOR_STATES['DISCONNECTED'], '')

    def isAvailable(self):
        return (self.running and self.connected and self.registered and not self.listening and not self.rpcLock.locked() and not self.rpcRequestId)
    
    def genRPCCallMsg(self, call, args, rpcRequestId=''):
        
        
        return {
                'msgType':'rpc',
                'method': call,
                'args' : args,
                'requestId': rpcRequestId
            }
        
    def rpcCall(self, call, args, timeout=30):
        """
            Send message and return response or raise
            exception if timeout occurs
        """
        self.rpcLock.acquire(True)
        response = None
        
        try:
            if self.rpcRequestId:
                raise Exception("RPC request already in progress")
            
            self.rpcRequestId = "%s%s" %(str(id(threading.current_thread())),time.time())
            
            if not self.rpcResponse.empty():
                self.rpcResponse.get(False)
                self.rpcResponse.task_done()
            
                    
            sendMsg = self.genRPCCallMsg(call, args, self.rpcRequestId)
    
            self.sock.sendall(json.dumps(sendMsg) + "\n")
            try:
                response = self.rpcResponse.get(True, timeout)
                self.rpcResponse.task_done()
            except:
                raise Exception("Request timed out: %s", json.dumps(sendMsg))
                
        finally:
            self.rpcLock.release()
            self.rpcRequestId = None
            
        return response
    
    def listen(self, msgTypes, listenerCallback):
        """
            Listen for all messages of types msgTypes
        """
        self.listenFor = msgTypes
        self.listenerCallback = listenerCallback
        self.listening = True
    
    def waitResponse(self):
        
        while self.running:
            
            try:
    
                # This will block            
                logger.debug("Waiting for response")    
                response = self.file.readline()
                
                #logger.debug("Got response %s" %(response,))
                
                
                # EOF
                if len(response) == 0 or response[-1] != "\n":
                    raise Exception('Connection closed by remote host')
    
            # assume disconnect by server
            except Exception as e:
                
                if self.file is not None:
                    logger.exception(e)
                
                # Error state
                if self.running:
                    self.setState(constants.CONNECTOR_STATES['ERROR'], 'Connection closed - will attempt to reconnect')
    
                self.disconnect()
                
                return None
                
            try:
                message = json.loads(response)
            except Exception as e:
                logger.exception(e)
                continue
            
            if message.get('msgType', '') == 'rpc_heartbeat':
                """ Discard heartbeats """
                continue
        
            return message

    def run(self):
        """
            Main running loop
        """
        
        self.running = True
        
        while self.running:
            
            while not self.connected:
                
                if not self.running: break
                self.connect()
                if not self.running: break
                
                if not self.connected:
                    
                    for i in range(0,self.connectionRetryInterval):
                        if self.running: time.sleep(1)
                        else: break
            
                if not self.connected: break
                
                if not self.registered:
                    try:
                        self.register()
                    except Exception as e:
                        self.disconnect()
                        logger.exception(e)
                        continue
                    
                    self.setState(constants.CONNECTOR_STATES['RUNNING'], '')
                
            
            message = self.waitResponse()
            
            if not message: continue
            
            #messageLogger.debug("Got message: %s" %(message,))


            if self.listening and message.get('msgType','') in self.listenFor:
                """ In listening mode. Client just sits and passes messages
                    off to listenerCallback """
                self.listenerCallback(message)
                continue
            
            if message.get('requestId',None):
                
                """ Respond to request id """
                if message['requestId'] == self.rpcRequestId:
                    self.rpcResponse.put(message)
                else:
                    logger.error("Response received out of order (current %s): %s" %(self.rpcRequestId, message))
                     
            else:
                raise Exception("Unexpected server message: %s" %(message,))
                
             
            
            time.sleep(self.pollInterval)
        
        self.disconnect()



class vboxRPCEventListener(threading.Thread):
    
    id = None
    server = None
    
    pollInterval = 0.2
    
    onEvent = None
    onStateChange = None
    
    sock = None
    file = None
    
    connected = False
    running = False
    registered = False
    
    connectionRetryInterval = 10
        
    def __init__(self, server, onEvent, onStateChange):
        
        self.server = server
        
        print "here.....asdfpoaisjdfpoiajsdpofijaspodifjsdfkj"
        self.id = server['id']
                
        self.onEvent = onEvent
        self.onStateChange = onStateChange
        
        # Initial state is disconnected
        self.onStateChange(self.id, constants.CONNECTOR_STATES['DISCONNECTED'], '')
        
        threading.Thread.__init__(self, name="%s-%s" %(self.__class__.__name__,id(self)))
        
    def connect(self):
        
        
        try:
            url = urlparse(self.server['location'])
            
        except Exception as e:

            self.disconnect()            
            self.stop()

            # Error state
            self.onStateChange(self.id, constants.CONNECTOR_STATES['ERROR'], "Failed to parse server location %s" %(self.server['location']))
            
            return
        

        try:
            
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((url.hostname, url.port))
            
            self.file = self.sock.makefile()
            self.connected = True
            
            call = {
                'msgType' : 'registerStream',
                'service' : 'vboxEvents'
            }
            
            try:
                
                self.sock.sendall(json.dumps(call) + "\n")
    
                self.onStateChange(self.id, constants.CONNECTOR_STATES['REGISTERING'], '')
                
            except Exception as e:
                logger.exception(str(e))
                self.disconnect()
                return

                        
        except Exception as e:

            logger.exception("%s %s" %(self.server['location'], str(e)))

            # Error state
            self.onStateChange(self.id, constants.CONNECTOR_STATES['ERROR'], str(e))
            

            
    def disconnect(self):

        if self.sock:
            self.sock.close()
        
        if self.file:
            try:
                self.file._sock.close()
            except:
                pass
            self.file.close()
        
        self.connected = False
        self.sock = None
        self.file = None
        self.registered = False
    
    def stop(self):
        self.running = False
        self.disconnect()
        
        self.onStateChange(self.id, constants.CONNECTOR_STATES['DISCONNECTED'], '')

        
    def run(self):
        
        self.running = True
        
        while self.running:
            
            while not self.connected:
                
                if not self.running: break
                self.connect()
                if not self.running: break
                
                if not self.connected:
                    
                    for i in range(0,self.connectionRetryInterval):
                        if self.running: time.sleep(1)
                        else: break
            
            try:

                # This will block            
                logger.debug("Waiting for response")    
                response = self.file.readline()
                
                logger.debug("Got response %s" %(response,))
                
                # EOF
                if len(response) == 0 or response[-1] != "\n":
                    raise Exception('Connection closed')

            # assume disconnect by server
            except Exception as e:
                
                if self.file is not None:
                    logger.exception(str(e))
                
                # Error state
                if self.running:
                    self.onStateChange(self.id, constants.CONNECTOR_STATES['ERROR'], 'Connection closed - will attempt to reconnect')

                self.disconnect()
                
                continue
                
            try:
                message = json.loads(response)
            except Exception as e:
                logger.exception(str(e))
                continue
            
            messageLogger.debug("Got message: %s" %(message,))

            if message.get('msgType', '') == 'rpc_heartbeat':
                """ Discard heartbeats """
                continue

            if message.get('msgType','') == 'rpc_exception':
                """ Error... disconnect """
                self.onStateChange(self.id, constants.CONNECTOR_STATES['ERROR'], message.get('error', 'Unknown RPC error'))
                self.disconnect()
                continue

                
            if self.registered and message.get('event',None):
                """ When we're registered, we accept events """
                # add our id
                message['event']['connector'] = self.id     
                self.onEvent(message['event'])
                continue
                
            elif not self.registered and message.get('msgType','') == 'registerStream_response':
                """ Register stream response """

                self.registered = True
                
                # Running state
                self.onStateChange(self.id, constants.CONNECTOR_STATES['RUNNING'], '')

                continue
            
            
            time.sleep(self.pollInterval)
        
        self.disconnect()
