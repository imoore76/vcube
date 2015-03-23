from vcube.dispatchers import dispatcher_parent, jsonout, require_admin
import cherrypy
import vcube

class dispatcher(dispatcher_parent):
    
    
    @jsonout
    @require_admin
    def getUsers(self, *args, **kwargs):
        return vcube.getInstance().accounts.getUsers()
    getUsers.exposed = True
    
    @jsonout
    @require_admin
    def getGroups(self, *args, **kwargs):
        return vcube.getInstance().accounts.getGroups()
    getGroups.exposed = True
    
    @jsonout
    @require_admin
    def updateGroup(self, *args, **kwargs):
        return vcube.getInstance().accounts.updateGroup(kwargs)
    updateGroup.exposed = True

    @jsonout
    @require_admin
    def deleteGroup(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    def addGroup(self, *args, **kwargs):
        return vcube.getInstance().accounts.addGroup(kwargs)
    addGroup.exposed = True

    @jsonout
    @require_admin
    def updateUser(self, *args, **kwargs):
        pass

    @jsonout
    @require_admin
    def deleteUser(self, *args, **kwargs):
        pass
    
    @jsonout
    @require_admin
    def addUser(self, *args, **kwargs):
        pass
    