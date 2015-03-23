/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.ServerTasksAndEvents', {
    extend: 'vcube.controller.XTasksAndEventsTab',
    
    /* Nav tree selection type field */
    selectionType: 'server',

    /* Parameter to add to proxy */
    requestIdProperty: 'sever',
    
    /* log data property where we can find the server id */
    logDataProperty: 'connector',
   
    /* Watch for events */
    init: function() {
    	
    	
    	this.control({
    		
        	'viewport > #MainPanel > ServerTabs > TasksAndEvents' : {
        		show: this.onShow,
    			render: function(panel) {
    				
    				// Reconfigure panel with unique store instance
    				this.eventStore = null;
    				this.taskStore = null;
    				
    				this.eventStore = panel.down('#events').getStore();
    				this.taskStore = panel.down('#tasks').getStore();
    				
    				this.controlledTab = panel;
    				
    				this.onRender(panel);
    			}
        	}
        });
    	
    	this.callParent(arguments);
    }

});



 