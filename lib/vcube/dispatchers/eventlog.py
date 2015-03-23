from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy

import vcube, pprint

from vcube.models import EventLog

class dispatcher(dispatcher_parent):


    @jsonout
    def getEvents(self, *args, **kwargs):
        pprint.pprint(kwargs)
        q = EventLog.select()
        if kwargs.get('vm', None):
            q = q.where(EventLog.machine == kwargs.get('vm'))
        elif kwargs.get('connector', None):
            q = q.where(EventLog.connector == kwargs.get('connector'))
        if kwargs.get('page', None):
            q = q.paginate(int(kwargs.get('page')), kwargs.get('limit', 25))
        elif kwargs.get('limit', None):
            q = q.limit(int(kwargs.get('limit')))
        
        return list(q.order_by(EventLog.id.desc()).dicts())
        
    getEvents.exposed = True
        


