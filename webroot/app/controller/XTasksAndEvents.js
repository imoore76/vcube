/*
 * Events and tasks controller parent class
 */
Ext.define('vcube.controller.XTasksAndEvents', {
    extend: 'Ext.app.Controller',
    
    statics: {
    	cancelProgress: function(progress_id, connector_id) {
    		vcube.utils.ajaxRequest("vbox/progressCancel",{progress:progress_id, connector: connector_id});
    	},    	
    },
    
    /* Store limit ? */
    storeLimit: 0,
    
    
    /* Watch for events */
    init: function() {
    	
    	// Redraw entire tab on machine data change
    	this.application.on({
    		'eventLogEntry': this.onEventLogEntry,
    		'taskLogEntry' : this.onTaskLogEntry,
    		'taskLogUpdate' : this.onTaskLogUpdate,
    		scope: this
    	});
    },
    
    
    /* These will be filled later */
    eventStore : null,
    taskStore: null,
        
    
    /*
     * Setup item dblclick on render
     */
    onRender: function(panel) {
    	panel.down('#events').on('itemdblclick', this.onEventDblClick);
    	panel.down('#tasks').on('itemdblclick', this.onTaskDblClick);
    },
    
    /* On item dblclick */
    onTaskDblClick: function(grid, record) {

    	var win = Ext.create('vcube.view.TasksAndEvents.TaskDetails');
    	win.show();
    	win.setLoading(true);
    	
    	var values = Ext.apply({},record.getData());
    	
    	values.name = Ext.String.htmlEncode(values.name);
    	values.details = Ext.String.htmlEncode(values.details);
    	try {
    		values.connector = Ext.String.htmlEncode(vcube.storemanager.getStoreRecord('server',values.connector).get('name'));    		
    	} catch(err) {}
    	try {
    		values.machine = vcube.storemanager.getStoreRecord('vm',values.machine).get('name');
    	} catch(err) {}
    	values.category = vcube.app.constants.LOG_CATEGORY_TEXT[values.category];
    	values.status = vcube.app.constants.TASK_STATUS_TEXT[values.status];
    	
    	win.down('#form').getForm().setValues(values);
    	win.setLoading(false);
    },

    /* On item dblclick */
    onEventDblClick: function(grid, record) {
    	
    	var win = Ext.create('vcube.view.TasksAndEvents.EventDetails');
    	win.show();
    	win.setLoading(true);
    	
    	var values = Ext.apply({},record.getData());
    	
    	values.name = Ext.String.htmlEncode(values.name);
    	values.details = Ext.String.htmlEncode(values.details);

    	try {
    		values.connector = Ext.String.htmlEncode(vcube.storemanager.getStoreRecord('server',values.connector).get('name'));    		
    	} catch(err) {}
    	try {
    		values.machine = vcube.storemanager.getStoreRecord('vm',values.machine).get('name');
    	} catch(err) {}
    	values.category = vcube.app.constants.LOG_CATEGORY_TEXT[values.category];
    	values.severity = vcube.app.constants.SEVERITY_TEXT[values.severity];
    	
    	win.down('#form').getForm().setValues(values);
    	win.setLoading(false);
    },

    /* Populate stores */
    populate: function() {
    	
    	this.eventStore.removeAll();
    	this.taskStore.removeAll();
    	
    	this.eventStore.load();
    	this.taskStore.load();
    	
    },
    
    /* Trim store if there is a limit set */
    trimStore: function(store) {
    	if(!this.storeLimit) return;    	
    	store.remove(store.getRange(this.storeLimit));
    },
    
    /* Event log entry event */
    onEventLogEntry: function(event) {
    	
    	if(!(this.eventStore)) return;
    	this.eventStore.insert(0,event.eventData);
    	this.trimStore(this.eventStore);
    },
    
    /* Task log entry event */
    onTaskLogEntry: function(event) {
    	
    	if(!(this.taskStore)) return;
    	
    	this.taskStore.insert(0,event.eventData);
    	this.trimStore(this.taskStore);
    	
    },

    /* Task log update event */
    onTaskLogUpdate: function(event) {

    	if(!(this.taskStore)) return;

    	var record = this.taskStore.getById(event.eventData.id);
    	if(!record) {
    		this.onTaskLogEntry(event);
    		return;
    	}
    	record.set({
    		'completed': event.eventData['completed'],
    		'details': event.eventData['details'],
    		'machine': event.eventData['machine'],
    		'name': event.eventData['name'],
    		'status': event.eventData['status'],
    		'progress': event.eventData['progress']
    	});
    }

    
});



 