"""
    Application constants
"""

__all__ = ['TASK_STATUS', 'TASK_STATUS_TEXT', 'CONNECTOR_STATES','CONNECTOR_STATES_TEXT','SEVERITY','SEVERITY_TEXT','LOG_CATEGORY','LOG_CATEGORY_TEXT']

TASK_STATUS = {
    'STARTED' : 0,
    'INPROGRESS' : 5,
    'COMPLETED' : 100,
    'ERROR' : 105,
    'CANCELED' : 110
}

TASK_STATUS_FIRST_STOPPED_STATE = 100

TASK_STATUS_TEXT = {
    0 : 'Started',
    5 : 'In progress',
    100 : 'Completed',
    105 : 'Error',
    110 : 'Canceled'
}

CONNECTOR_STATES = {
    'DISABLED' : -1,
    'DISCONNECTED' : 0,
    'ERROR' : 20,
    'REGISTERING' : 30,
    'RUNNING' : 100
}

CONNECTOR_STATES_TEXT = {
    -1: 'Disabled',
    0 : 'Disconnected',
    20 : 'Error',
    30 : 'Registering',
    100 : 'Running'
}

SEVERITY = {
    'CRITICAL' : 10,
    'ERROR' : 8,
    'WARNING' : 6,
    'INFO' : 4
}

SEVERITY_TEXT = {
   10 : 'Critical',
   8 : 'Error',
   6 : 'Warning',
   4 : 'Info'
}

LOG_CATEGORY = {
   'VCUBE' : 0,
   'CONFIGURATION' : 5,
   'STATE_CHANGE' : 10,
   'SNAPSHOT' : 15,
   'MEDIA' : 20,
   'VBOX_HOST' : 30,
   'VBOX' : 40,
   'CONNECTOR' : 45
}

LOG_CATEGORY_TEXT = {
   0 : 'vCube',
   5 : 'Configuration change',
   10 : 'State change',
   15 : 'Snapshot',
   20 : 'Media',
   30 : "VirtualBox Host",
   40  : "VirtualBox",
   45 : "Connector"
}

