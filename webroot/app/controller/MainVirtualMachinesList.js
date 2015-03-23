/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.MainVirtualMachinesList', {
    extend: 'vcube.controller.XVirtualMachinesList',
    
    /* Nav tree selection type field */
    selectionType: 'vmsFolder',

    /* VM record property which must match selection id */
	vmPropertyFilterProperty: null, // no filter

    init: function() {


    	this.control({
    		
        	'viewport > #MainPanel > VirtualMachinesList' : {
    			render: function(panel) {
    				this.setControlledList(panel)
    			}
        	}
        });
    	
		// VMs added to main VM store...
    	vcube.storemanager.getStore('vm').on('add', this.onVMStoreRecordsAdded, this);
    	
    	// NOTE: removal is handled by main XVirtualMachinesList because removal
    	// is global
    	
    	this.callParent(arguments);
    },
    
    onVMStoreRecordsAdded: function(store, records) {
		this.vmStore.add(records);
    }
    

});


