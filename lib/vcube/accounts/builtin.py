
import os, sys

from vcube.models import AuthUser, User, Group
from vcube.utils import genhash


CAPABILITIES = [
    'groups',
    'updategroups',
    'updateusers',
    'logout'
]


class interface:
    
    def getUser(self, username):
        return dict(User.get(User.username == username)._data.copy())
    
    def getGroup(self, groupname):
        return dict(Group.get(Group.name == groupname)._data.copy())
    
    def getUsers(self):
        return list(User.select().dicts())
    
    def getGroups(self):
        return list(Group.select().dicts())
    
    def changePassword(self, username, password):
        u = AuthUser.get(AuthUser.username == username)
        u.password = genhash(password)
        u.save()
        return True
    
    def updateUser(self, **updata):
        
        username = updata.get('username', None)
        if username is None: return False
        del updata['username']
        
        u = User.get(User.username == username)
        newpw = None
        for k, v in updata.iteritems():
            if k == 'password':
                newpw = v
                continue
            setattr(u, k, v)
        u.save()
        
        if newpw is not None:
            self.changePassword(username, newpw)
            
    def addGroup(self, name, description = ''):
        g = Group()
        g.name = name
        g.description = description
        g.save()
        return True
        
    def updateGroup(self, updata):

        id = updata.get('id', None)
        if id is None: return False
        del updata['id']
        
        g = Group.get(Group.id == id)
        
        for k, v in updata.iteritems():
            setattr(g, k, v)
        g.save()
        
        return self.getGroup(g.name)
        
    
    def deleteGroup(self, groupname):
        Group.get(name == groupname).delete()
        return True
    
    def deleteUser(self, username):
        User.get(name == username).delete()
        return True
    
    def authenticate(self, username, password):
        try:
            u = AuthUser.get(AuthUser.username == username and AuthUser.password == genhash(password))
            return self.getUser(username)
        except AuthUser.DoesNotExist:
            pass
        return False
    