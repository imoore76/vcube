/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.TasksAndEvents', {
    extend: 'vcube.controller.XTasksAndEvents',
    
    /* Store limit ? */
    storeLimit: 25,
    
    /* Watch for events */
    init: function(){
    	
    	// Initialize stores on render of the panel
    	this.control({
    		
    		'viewport > TasksAndEvents' : {
    			
    			render: function(panel) {
    				// Reconfigure panel with unique store instance
    				this.eventStore = panel.down('#events').getStore();
    				this.taskStore = panel.down('#tasks').getStore();
    				
    				this.onRender(panel);
    			}
    		}
    	});
    	
    	// Populate when app starts
    	this.application.on({
    		'start' : this.populate,
    		scope: this
    	});
    	
    	this.callParent(arguments);
    }
    
});



 