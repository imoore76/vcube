/**
 * Server actions
 */
Ext.define('vcube.actions.server',{

	statics: {
		
		isRunning: function(selectionModel) {
			var selected = selectionModel.getSelection();
			return (selected.length == 1 && vcube.storemanager.getStoreRecordData('server',selected[0].get('rawid')).state == vcube.app.constants.CONNECTOR_STATES.RUNNING);
		},
		
		'new': {
		
			action: function() {
				
			}
		},
		
		newvm: {
			
			action: function(selectionModel) {
				
			},
			enabled_test: function(sm) { return vcube.actions.server.isRunning(sm); }
		},
		
		addvm: {
			
			action: function(selectionModel) {
				
				var serverId = selectionModel.getSelection()[0].get('rawid');

				var browser = Ext.create('vcube.widget.fsbrowser',{
	    			serverId: serverId,
	    			title: 'Select a machine to add...',
	    			pathType: 'addMachine',
	    			icon: 'images/vbox/vm_add_16px.png',
	    			savePath: true,
	    			fileTypes: ['vbox','xml']
	    		});
	    		
	    		Ext.ux.Deferred.when(browser.browse()).done(function(f) {
	    			vcube.utils.ajaxRequest('vbox/machineAdd',{connector:serverId,file:f});
	    		});

			},
			
			enabled_test: function(sm) { return vcube.actions.server.isRunning(sm); }
			
		},
		
		vbsettings: {
			action: function(selectionModel) {
				
			},
			
			enabled_test: function(sm) { return vcube.actions.server.isRunning(sm); }
		},
		
		/** Delete / Remove a server */
		'remove': {
			action: function(selectionModel) {
				
			}
		}
	}
	
});
