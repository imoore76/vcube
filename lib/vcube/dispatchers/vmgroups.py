from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy

import vcube, pprint

from vcube.models import VMGroup

class dispatcher(dispatcher_parent):


    @jsonout
    @require_admin
    def addGroup(self, *args, **kwargs):
        c = VMGroup(VMGroup.name == kwargs.get('name'))
        for attr in ['name','description', 'parent_id']:
            setattr(c, attr, kwargs.get(attr))
        c.save()
        
        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'VMGroupAdded',
            'group' : dict(c._data.copy())
        })
        
        return True
    addGroup.exposed = True
        

    @jsonout
    @require_admin
    def deleteGroup(self, *args, **kwargs):
        c = VMGroup(VMGroup.id == kwargs.get('id', 0)).delete()
        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'VMGroupRemoved',
            'group_id' : kwargs.get('id', 0)
        })

        return True
    deleteGroup.exposed = True
    
    @jsonout
    @require_admin
    def updateGroup(self, *args, **kwargs):
        
        c = VMGroup.get(VMGroup.id == kwargs.get('id',0))
        
        for attr in ['name','description', 'parent_id']:
            if kwargs.get(attr,None) is not None:
                setattr(c, attr, kwargs.get(attr))
        c.save()

        vcube.getInstance().pumpEvent({
            'eventSource' : 'vcube',
            'eventType':'VMGroupUpdated',
            'group' : dict(c._data.copy())
        })

        return True
    updateGroup.exposed = True
    
    @jsonout
    @require_admin
    def getGroups(self, *args, **kwargs):
        return list(VMGroup.select().dicts())    
    getGroups.exposed = True

