
import json, cherrypy, traceback, pprint
import datetime
import copy

import logging
logger = logging.getLogger(__name__)

__all__ = ['accounts', 'connectors', 'vbox', 'app', 'vmgroups', 'eventlog', 'tasklog']


jsonResponseTemplate = {'data':{'success':False,'errors':[],'messages':[],'responseData':None}}

class vcubeJsonEncoder(json.JSONEncoder):
    
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S')
        return super(vcubeJsonEncoder, self).default(obj)

"""
    Input data comes from json posted data

"""
def jsonin(func):

    def decorated(*args, **kwargs):

        try:
            kwargs.update(json.loads(cherrypy.request.body.read(int(cherrypy.request.headers['Content-Length']))))
        except:
            pass
        
        return func(*args, **kwargs)

    return decorated

""""
    Send data as JSON
"""
def jsonout(func):
    
    def decorated(*args, **kwargs):

        cherrypy.response.headers['Content-Type'] = 'application/json'

        try:
            kwargs.update(json.loads(cherrypy.request.body.read(int(cherrypy.request.headers['Content-Length']))))
        except:
            pass
        
        if kwargs.get('_jsonout_raw') == True:
            return func(*args, **kwargs)
        
        jsonResponse = copy.deepcopy(jsonResponseTemplate)

        try:
            
            jsonResponse['data']['responseData'] = func(*args, **kwargs)
            jsonResponse['data']['success'] = True
            
            
        except Exception as ex:
            
            logger.exception(str(ex))

            e = {'details': traceback.format_exc(), 'error': '%s' %(str(ex),) }
            jsonResponse['data']['errors'].append(e)
        
        if kwargs.get('_dispatcher_pprint', None):
            return pprint.pformat(jsonResponse)
        
        return json.dumps(jsonResponse, cls=vcubeJsonEncoder)
    
    return decorated

"""
    Require a valid session
"""
def require_auth(func):
    def decorated(*args, **kwargs):
        return func(*args, **kwargs)
    return decorated


"""
    Require an administrator
"""
def require_admin(func):
    def decorated(*args, **kwargs):        
        return func(*args, **kwargs)
    return decorated


"""
    Parent dispatcher class
"""
class dispatcher_parent(object):
    
    errors = []
    messages = []
        
    