Ext.define('vcube.storemanager',{

	singleton: true,
	
	vmRuntimeOverlay: null,

	/**
	 * Virtual machine store
	 */
	vmStore: Ext.create('vcube.store.VirtualMachines'),


	/**
	 * VM Group store
	 */
	vmGroupStore: Ext.create('Ext.data.Store',{
		autoload: false,
		fields : [
		      {name: 'id', type: 'string'},
		      {name: 'name', type: 'string'},
		      {name: 'description', type: 'string'},
		      {name: 'parent_id', type: 'int'}
		]
	}),


	/**
	 * Servers store
	 */
	serverStore: Ext.create('Ext.data.Store',{
		autoload: false,
		fields : [
		   {name: 'id', type: 'string'},
		   {name: 'name', type: 'string'},
		   {name: 'description', type: 'string'},
		   {name: 'location', type: 'string'},
		   {name: 'state_text', type: 'string'},
		   {name: 'state', type: 'int'}
		]
	}),

	/**
	 * Return requested store
	 */
	getStore: function(type) {
		switch(type.toLowerCase()) {
			case 'vm':
				return vcube.storemanager.vmStore;
			case 'vmgroup':
				return vcube.storemanager.vmGroupStore;
			case 'server':
				return vcube.storemanager.serverStore;
		}
	},
	
	
	/**
	 * Update store if record exists
	 */
	updateStoreRecord: function(type, id, updates) {
		vcube.storemanager.getStoreRecord(type, id).set(updates);
	},
	
	/**
	 * Get a single store record by id
	 */
	getStoreRecord: function(type, id) {
		return vcube.storemanager.getStore(type).getById(String(id));
	},
	
	/**
	 * Get raw record data
	 */
	getStoreRecordData: function(type, id) {
		try {
			return vcube.storemanager.getStoreRecord(type, id).getData();			
		} catch (err) {
			
			console.log(type + ' ' + id);
			console.log(vcube.storemanager.getStore(type));
			
		}
	},
	
	/* Watch for "raw" events */
	start: function() {
		
		var promise = Ext.create('Ext.ux.Deferred');
		
		/*
		 * 
		 * VirtualBox events
		 * 
		 */
		
		var applyEnrichmentData = function(eventData) {
			vcube.storemanager.updateStoreRecord('vm', eventData.machineId, eventData.enrichmentData)			
		};
		
		vcube.app.on({
			
			/*
			 * Server / connector events
			 */
		    ConnectorUpdated: function(eventData) {
		    	vcube.storemanager.updateStoreRecord('server', eventData.connector_id, eventData.connector);
		    },
		    
		    ConnectorStateChanged: function(eventData) {
		    	vcube.storemanager.updateStoreRecord('server', eventData.connector_id, {state:eventData.state, state_text: eventData.state_text});
		    },

		    /*
		     * VM Group events
		     */
			VMGroupAdded: function(eventData) {
				vcube.storemanager.getStore('vmgroup').add(eventData.group);
			},
			
			VMGroupRemoved: function(eventData) {
				var s = vcube.storemanager.getStore('vmgroup');
				s.remove(s.getById(eventData));
			},
			
			VMGroupUpdated: function(eventData) {
				vcube.storemanager.updateStoreRecord('vmgroup', eventData.group.id, eventData.group);
			},


		    /*
		     *	Machine events 
		     */
			
			// Machine data has changed
			'vboxMachineDataChanged' : applyEnrichmentData,
			
			// Snapshot events
			'vboxSnapshotChanged' : function(eventData) {
				if(eventData.enrichmentData.isCurrentSnapshot)
					vcube.storemanager.updateStoreRecord('vm', eventData.machineId, {'currentSnapshotName':eventData.enrichmentData.name});	
			},

			// Machine state change
			'vboxMachineStateChanged' :function(eventData) {
				try {
					vcube.storemanager.updateStoreRecord('vm', eventData.machineId, Ext.apply({'state':eventData.state},eventData.enrichmentData));										
				} catch (err) {
					// this can happen after a machine is unregistered... 
				}
			},

			// Session state change
			'vboxSessionStateChanged' : function(eventData) {			
				vcube.storemanager.updateStoreRecord('vm', eventData.machineId,{sessionState:eventData.state});
			},

			
			// Remove vms from store
			'MachinesRemoved' : function(eventData) {
			
				var vmstore = vcube.storemanager.getStore('vm');
				
				Ext.each(eventData.machines, function(vmid){
					vmstore.remove(vmstore.getById(vmid));
				});
					
			},

			// Add VMs when machines are added
			'MachinesAdded' : function(eventData) {
				vcube.storemanager.getStore('vm').add(eventData.machines);
			},
			
			// Runtime CPU changed event
			'vboxCPUChanged' : function(eventData) {

				
				if(eventData.enrichmentData.add) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount++;
				} else {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount--;
				}

			},
			
			// Runtime execution cap
			'vboxCPUExecutionCapChanged' : function(eventData) {
			
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUExecutionCap = eventData.executionCap;
				}

			},
			
			'vboxMachineGroupChanged' : function(eventData) {
				vcube.storemanager.updateStoreRecord('vm', eventData.machineId,{group_id:eventData.group});
			},

			'vboxMachineIconChanged' : function(eventData) {
				vcube.storemanager.updateStoreRecord('vm', eventData.machineId,{icon:eventData.icon});
			},
			
			
			
			scope: vcube.storemanager

		});
		
		var loadCount = 3;
		function loaded() {
			if(--loadCount == 0) {
				promise.resolve();
			}
		}
		
		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('app/getVirtualMachines')).done(function(data) {
			vcube.storemanager.vmStore.loadData(data);
			loaded();
		});
		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vmgroups/getGroups')).done(function(data) {
			vcube.storemanager.vmGroupStore.loadData(data);
			loaded();
		});
		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('connectors/getConnectors')).done(function(data) {
			vcube.storemanager.serverStore.loadData(data);
			loaded();
		});
		
		return promise;

	},
	
	/**
	 * "Called when application stops"
	 */
	stop: function() {
		vcube.storemanager.vmStore.removeAll();
		vcube.storemanager.vmGroupStore.removeAll();
		vcube.storemanager.serverStore.removeAll();
	}

});