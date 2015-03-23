Ext.define('vcube.controller.VMDetails', {
    
	extend: 'vcube.controller.XInfoTab',

	
    /* Watch for events */
    init: function(){
    	
    	/* Setup sections */
    	this.sectionConfig = vcube.view.VMDetails.sections;
    	
        this.control({
	        'viewport > #MainPanel > VMTabs > VMDetails' : {
	        	render: this.onTabRender
	        }
        });

        /* Selection item type (vm|server|group) */
        this.selectionItemType = 'vm';
        
        /* Repopulate on Events*/
        this.repopulateOn = ['MachineDataChanged'];
        
        /* Repopulate event attribute */
        this.eventIdAttr = 'machineId';

        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	return vcube.vmdatamediator.getVMDataCombined(data.id);
        }
        
        this.callParent();
        
    }
    

});
