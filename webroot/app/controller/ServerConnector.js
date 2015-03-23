/*
 * Server summary tab controller
 */
Ext.define('vcube.controller.ServerConnector', {
	
    extend: 'vcube.controller.XInfoTab',
    
    /* Watch for events */
    init: function(){

    	/* Setup sections */
    	this.sectionConfig = vcube.view.ServerConnector.sections;

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'server';

    	/* Repopulate on Events*/
    	this.repopulateOn = [];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'connector_id';
    	    	
        /* Populate data function returns a deferred or data */
        this.populateData = function(data) {
        	if(data.state == vcube.app.constants.CONNECTOR_STATES['RUNNING']) {
        		return vcube.utils.ajaxRequest('vbox/getStatus',{connector:data.id});
        	} else {
        		return null;
        	}
        };

    			
        this.control({
	        'viewport > #MainPanel > ServerTabs > ServerConnector' : {
	        	render: this.onTabRender
	        },
	        'viewport > #MainPanel > ServerTabs > ServerConnector #editConnector' : {
	        	click: this.editConnector
	        }
        });
        
        this.callParent();
        
    },
    
    /* Edit connector */
    editConnector: function() {
    	
    	var self = this;
    	
    	Ext.create('vcube.view.ServerConnector.AddEdit',{
    		title: 'Edit Connector',
    		listeners: {
    			
    			/* Set values when window is shown */
    			show: function(pane) {
    				
    				/* Change button on form validity change */
    				pane.down('#form').on('validitychange', function(frm, valid) {
    					pane.down('#save').setDisabled(!valid);
    				});
    				
    				var connectorData = vcube.storemanager.getStoreRecordData('server',this.selectionItemId);
    				pane.down('#form').getForm().setValues(
						Ext.Object.merge({},connectorData,{
							state: (connectorData.state > vcube.app.constants.CONNECTOR_STATES['DISABLED'] ? vcube.app.constants.CONNECTOR_STATES['DISCONNECTED'] : connectorData.state)  
						})
    				);
    				
    				/* Save function */
    				pane.down('#save').on('click',function(btn){
    					
    					var win = btn.up('.window');
    					
    					win.setLoading(true);
    					
    					Ext.ux.Deferred.when(vcube.utils.ajaxRequest('connectors/updateConnector',pane.down('.form').getForm().getValues()))
    						.done(function(data) {
		    					
		    						if(data) {
		    							win.close();
		    							return;
		    						}
		    						
		    						win.setLoading(false);
		    						
							}).fail(function(){
    							win.setLoading(false);
    						});
    				});
    				
    			},
    			scope: this
    		}
    	}).show();
    	
    	
    }

});
    	
