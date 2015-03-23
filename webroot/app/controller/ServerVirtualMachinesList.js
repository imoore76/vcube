/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.ServerVirtualMachinesList', {
    extend: 'vcube.controller.XVirtualMachinesList',
    
    /* Nav tree selection type field */
    selectionType: 'server',

    /* VM record property which must match selection id */
	vmPropertyFilterProperty: 'connector_id',

    /* Watch for events */
    init: function() {


    	this.control({
    		
        	'viewport > #MainPanel > ServerTabs > VirtualMachinesList' : {
    			render: function(panel) {
    				this.setControlledList(panel)
    			}
        	}
        });
    	
    	this.callParent(arguments);
    }

});


