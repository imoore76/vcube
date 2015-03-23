

from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
from vcube.models import Connector
import cherrypy

import vcube
from vcube import constants

class dispatcher(dispatcher_parent):

    @jsonout
    @require_admin
    def addConnector(self, *args, **kwargs):
        ex = None
        try:
            ex = Connector(Connector.name == kwargs.get('name')).get()
        except:
            pass
        if ex:
            raise Exception("A connector with that name exists")
        
        c = Connector()
        for attr in ['name','location','description']:
            setattr(c, attr, kwargs.get(attr))
        c.state = 0
        c.save()
        
        # Tell application that a connector was added
        vcube.getInstance().addConnector(dict(c._data.copy()))
        
        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'ConnectorAdded',
            'connector_id' : c.id,
            'connector' : dict(c._data.copy())
        })

    
        vcube.getInstance().logTask({
            'name': 'Add connector',
            'user': cherrypy.session.get('user',{}).get('username','Unknown'),
            'details': 'Connector `%s` added' %(kwargs.get('name'),),
            'machine': '',
            'category': constants.LOG_CATEGORY['CONNECTOR'],
            'connector': kwargs.get('id', 0),
            'status': constants.TASK_STATUS['COMPLETED']
            
        })
    
        return True

    addConnector.exposed = True
        

    @jsonout
    @require_admin
    def deleteConnector(self, *args, **kwargs):
        
        c = Connector.get(Connector.id == kwargs.get('id',0))
        
        # Keep name for details
        name = c.name
        
        c.delete()
        
        # Tell application that a connector was removed
        vcube.getInstance().removeConnector(kwargs.get('id',0))
        

        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'ConnectorRemoved',
            'connector_id' : kwargs.get('id', 0)
        })
        

        vcube.getInstance().logTask({
            'name': 'Remove connector',
            'user': cherrypy.session.get('user',{}).get('username','Unknown'),
            'details': 'Connector `%s` removed' %(name,),
            'category': constants.LOG_CATEGORY['CONNECTOR'],
            'connector': kwargs.get('id', 0),
            'machine': '',
            'status': constants.TASK_STATUS['COMPLETED']
            
        })


        return True

    deleteConnector.exposed = True
    
    @jsonout
    @require_admin
    def updateConnector(self, *args, **kwargs):
        c = Connector.get(Connector.id == kwargs.get('id',0))
        for attr in ['name','location', 'description', 'state_text']:
            if kwargs.get(attr, None) is not None:
                setattr(c, attr, kwargs.get(attr))
                
        
        stateChanged = False
        if kwargs.get('state',None) is not None:
            if int(kwargs['state']) == constants.CONNECTOR_STATES['DISABLED'] or (c.state == constants.CONNECTOR_STATES['DISABLED'] and int(kwargs['state']) == constants.CONNECTOR_STATES['DISCONNECTED']):
                c.state = kwargs.get('state')
                stateChanged = True

        c.save()
        
        # Tell application that a connector was removed
        vcube.getInstance().updateConnector(dict(c._data.copy()))

        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'ConnectorUpdated',
            'connector_id' : c.id,
            'connector' : dict(c._data.copy())
        })

        vcube.getInstance().logTask({
            'name': 'Save connector settings',
            'user': cherrypy.session.get('user',{}).get('username','Unknown'),
            'details': 'Connector `%s` configuration changed' %(c.name,) + ('. State: %s' %(constants.CONNECTOR_STATES_TEXT[c.state],) if stateChanged else ''),
            'category': constants.LOG_CATEGORY['CONNECTOR'],
            'connector': kwargs.get('id', 0),
            'machine': '',
            'status': constants.TASK_STATUS['COMPLETED']
            
        })

        return True
    
    updateConnector.exposed = True
    
    @jsonout
    @require_admin
    def getConnectors(self, *args, **kwargs):
        return list(Connector.select().dicts())
    getConnectors.exposed = True


