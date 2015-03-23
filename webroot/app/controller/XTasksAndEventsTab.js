/*
 * Events and tasks tab controller parent class
 */
Ext.define('vcube.controller.XTasksAndEventsTab', {
    extend: 'vcube.controller.XTasksAndEvents',


    /* Nav tree selection type and ID holder */
    selectionType: null,
    selectionId: null,
    
    /* Property to set on proxy requests */
    requestIdProperty: null,
    
    /* Log data property to filter on */
    logDataProperty: null,
    
    /* Initially dirty */
    dirty: true,
    
    /* Store limit ? */
    storeLimit: 0,

    /* Tab that we are controlling */
    controlledTab: null,
    
    init: function() {

    	this.control({
    		'viewport > NavTree' : {
    			selectionchange: this.onSelectionChange
    		}
    	});
    	
    	this.callParent(arguments);

    },

    /* When tab is shown */
    onShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.populate();

    },

    /* Filter for events and tasks */
    filter: function(eventData) {
    	return (eventData[this.logDataProperty] == this.selectionId);
    },


    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {
    	
    	this.dirty = true;
    	
    	if(records.length && records[0].get('type') == this.selectionType) {

    		this.selectionId = records[0].get('rawid');    		
    		this.populate();
    	
    	} else {
    	
    		this.selectionId = null;
    	}
    	

    },
    
    /* Event log entry event */
    onEventLogEntry: function(event) {
    	
    	if(!(this.eventStore && this.filter(event.eventData))) return;
    	
    	// is this tab still visible?
    	if(!(this.controlledTab && this.controlledTab.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	this.callParent(arguments);
    	
    },
    
    /* Task log entry event */
    onTaskLogEntry: function(event) {
    	
    	if(!(this.taskStore && this.filter(event.eventData))) return;

    	// is this tab still visible?
    	if(!(this.controlledTab && this.controlledTab.isVisible())) {
    		this.dirty = true;
    		return;
    	}
    	
    	this.callParent(arguments);
    	
    },

    /* Task log update event */
    onTaskLogUpdate: function(event) {

    	if(!(this.taskStore && this.filter(event.eventData))) return;
    	
    	// is this tab still visible?
    	if(!(this.controlledTab && this.controlledTab.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	
    	this.callParent(arguments);

    },
    
    /* Return request properties for log population */
    getRequestProperties: function() {
    	var rp = {};
    	rp[this.requestIdProperty] = this.selectionId;
    	return rp;
    },

    /* Populate events */
    populate: function() {
    	
    	// is this tab still visible?
    	if(!(this.controlledTab && this.controlledTab.isVisible())) {
    		this.dirty = true;
    		return;
    	}
    	
    	this.dirty = false;
    	
		this.taskStore.getProxy().extraParams = this.eventStore.getProxy().extraParams = this.getRequestProperties();

		this.callParent(arguments);
		
    }




});