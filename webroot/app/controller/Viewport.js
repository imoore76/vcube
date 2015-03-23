/*
 * Main Panel Controller
 */
Ext.define('vcube.controller.Viewport', {
    extend: 'Ext.app.Controller',
    
    laodMask: null,
    
    showMask: function() {
    	this.loadMask.show();
    },
    hideMask: function() {
    	this.loadMask.hide();
    },
    /* Watch for events */
    init: function(){
    	
        this.control({
        	'viewport' : {
    		   afterrender: function(v) {
    			   this.loadMask = new Ext.LoadMask({target:v,useMsg:false});
    			   this.loadMask.show();
    		   }
        	}
        	
        });
                
    	/* Application level events */
        this.application.on({
            start: this.hideMask,
			stop: this.showMask,
			scope: this
        });

    }
});