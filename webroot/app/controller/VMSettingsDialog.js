Ext.define('vcube.controller.VMDetails', {
    
	extend: 'Ext.app.Controller',

	
    /* Watch for events */
    init: function(){
    	
    	/* Setup sections */
    	this.sectionConfig = vcube.view.VMDetails.sections;
    	
        this.control({
	        'SettingsDialog' : {
	        	
	        }
        });
        
    }

});
