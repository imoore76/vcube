
import vcube, models

from utils import genhash 

def database(config):
        
    for m in models.INSTALLMODELS:
        try:
            getattr(models, m).create_table()
        except:
            pass
    
    # create dummy class
    from mysqlsession import MySQLSession

    config = vcube.getConfig()
    
    dbconfig = {}
    for k,v in config.items('storage'):
        dbconfig[k] = v

    db = MySQLdb.connect(**dbconfig)

    cursor = db.cursor()
    cursor.execute(MySQLSession.SCHEMA % 'sessions')
    db.commit()
    
    # Insert admin user
    resetadmin(config)

def resetadmin(config):
    
    
    try:
        u = models.AuthUser.get(models.AuthUser.username == 'admin')
    except models.AuthUser.DoesNotExist:
        u = models.AuthUser()
        u.username = 'admin'
        u.name = 'Administrator'
        u.group_id = 0
    
    u.password = genhash('admin')
    u.save()
        