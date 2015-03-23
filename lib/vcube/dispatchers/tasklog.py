from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy

import vcube, pprint

from vcube.models import TaskLog

class dispatcher(dispatcher_parent):


    @jsonout
    def getTasks(self, *args, **kwargs):
        pprint.pprint(kwargs)
        q = TaskLog.select()
        if kwargs.get('vm', None):
            q = q.where(TaskLog.machine == kwargs.get('vm'))
        elif kwargs.get('connector', None):
            q = q.where(TaskLog.connector == kwargs.get('connector'))
        if kwargs.get('page', None):
            q = q.paginate(int(kwargs.get('page')), kwargs.get('limit', 25))
        elif kwargs.get('limit', None):
            q = q.limit(int(kwargs.get('limit')))
        
        return list(q.order_by(TaskLog.id.desc()).dicts())

    getTasks.exposed = True
        