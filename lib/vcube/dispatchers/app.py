
from vcube.dispatchers import dispatcher_parent, jsonout

import pprint

import vcube
import vcube.constants

import cherrypy

class dispatcher(dispatcher_parent):

    @jsonout
    def getVirtualMachines(self, *args, **kwargs):
        return vcube.getInstance().getVirtualMachines()
    
    getVirtualMachines.exposed = True
    
    @jsonout
    def getSession(self, *args, **kwargs):
        data = {}
        for k,v in cherrypy.session.items():
            data[k] = v
        return data
    
    getSession.exposed = True
    
    @jsonout
    def login(self, *args, **kwargs):
        
        
        pprint.pprint(kwargs)
        
        
        user = vcube.getInstance().accounts.authenticate(kwargs.get('u',''), kwargs.get('p',''))
        if user != False:
            cherrypy.session['user'] = user
            print "OK!!!!"
            return self.getSession(_jsonout_raw=True)
        return False
    
    login.exposed = True

    @jsonout
    def logout(self, *args, **kwargs):
        cherrypy.lib.sessions.expire()
        cherrypy.session.delete()
        return True
    
    logout.exposed = True
    
    @jsonout
    def getConstants(self, *args, **kwargs):
        constants = {}
        for k in vcube.constants.__all__:
            constants[k] = getattr(vcube.constants, k)
        return constants
    getConstants.exposed = True

