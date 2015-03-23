/**
 * @fileOverview Deferred data loader / cacher singleton. Provides vboxDataMediator
 * @author Ian Moore (imoore76 at yahoo dot com)
 * @version $Id: datamediator.js 543 2013-08-08 15:46:34Z imoore76 $
 * @copyright Copyright (C) 2010-2013 Ian Moore (imoore76 at yahoo dot com)
 */

/**
 * vcube.vmdatamediator
 * 
 */
Ext.define('vcube.vmdatamediator', {

	singleton: true,
	
	requires: ['vcube.utils'],
	
	/* Promises for data */
	promises : {
		'getVMDetails':{},
		'getVMRuntimeData':{}
	},
	
	/* Holds VM details */
	vmDetailsData : {},
	
	/* Holds VM runtime data */
	vmRuntimeData : {},
		
	/* Expire cached promise / data */
	expireVMDetails: function(vmid) {
		vcube.vmdatamediator.promises.getVMDetails[vmid] = null;
		vcube.vmdatamediator.vmDetailsData[vmid] = null;
	},
	expireVMRuntimeData: function(vmid) {
		vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = null;
		vcube.vmdatamediator.vmRuntimeData[vmid] = null;
	},
	expireAll: function() {
		for(var i in vcube.vmdatamediator.promises) {
			if(typeof(i) != 'string') continue;
			vcube.vmdatamediator.promises[i] = {};
		}
		vcube.vmdatamediator.vmRuntimeData = {};
		vcube.vmdatamediator.vmDetailsData = {};
	},
	
	stop: function() {
		vcube.vmdatamediator.expireAll();
	},
	
	
	/**
	 * Watch for events and update data
	 */
	watchEvents: function() {
		
		/*
		 * 
		 * VirtualBox events
		 * 
		 */
		
		// Raw event to data handlers
		vcube.app.on({
			
		
			'vboxMachineDataChanged' : function(eventData) {				
				vcube.vmdatamediator.expireVMDetails(eventData.machineId);
				vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
				
			},
			/*
			// Machine state change
			'vboxMachineStateChanged' :function(eventData) {

				// Expire runtime data on state change
				vcube.vmdatamediator.expireVMRuntimeData(eventData.machineId);
	
			},

			// Expire all data for a VM when machines are removed
			'MachinesRemoved' : function(eventData) {
			
				vcube.vmdatamediator.expireVMDetails(vmid);
				vcube.vmdatamediator.expireVMRuntimeData(vmid);
					
			},
			*/

			'vboxCPUChanged' : function(eventData) {

				if(eventData.enrichmentData.add) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount++;
				} else {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUCount--;
				}

			},
			
			'vboxNetworkAdapterChanged' : function(eventData) {
			
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					Ext.apply(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].networkAdapters[eventData.networkAdapterSlot], eventData.enrichmentData);
				}
			
			},

			'vboxMediumChanged' : function(eventData) {
			
				/* Medium attachment changed */
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					for(var a = 0; a < vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers.length; a++) {
						if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].name == eventData.controller) {
							for(var b = 0; b < vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments.length; b++) {
								if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments[b].port == eventData.port &&
										vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments[b].device == eventData.device) {
									
									vcube.vmdatamediator.vmRuntimeData[eventData.machineId].storageControllers[a].mediumAttachments[b].medium = (eventData.medium ? {id:eventData.medium} : null);
									break;
								}
							}
							break;
						}
					}
				}
			},
		/* Shared folders changed */
		//}).on('vboxSharedFolderChanged', function() {

		// VRDE runtime info
			'vboxVRDEServerChanged' : function(eventData) {

				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					Ext.apply(vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServer, eventData.enrichmentData);
				}
				
			},

			'vboxVRDEServerInfoChanged' : function(eventData) {

				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServerInfo.port = eventData.enrichmentData.port;
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].VRDEServer.enabled = eventData.enrichmentData.enabled;
				}

			},
			// Execution cap
			'vboxCPUExecutionCapChanged' : function(eventData) {
			
				if(vcube.vmdatamediator.vmRuntimeData[eventData.machineId]) {
					vcube.vmdatamediator.vmRuntimeData[eventData.machineId].CPUExecutionCap = eventData.executionCap;
				}

			},
			
			'vboxExtraDataChanged' : function(eventData) {
			
				// No vm id is a global change
				if(!(eventData.machineId && vcube.vmdatamediator.vmDetailsData[eventData.machineId])) return;
				
					switch(eventData.key) {
		
						// Save mounted media changes at runtime
						case 'GUI/SaveMountedAtRuntime':
							vcube.vmdatamediator.vmDetailsData[eventData.machineId].GUI.SaveMountedAtRuntime = eventData.value;
							break;
							
						// First time run
						case 'GUI/FirstRun':
							vcube.vmdatamediator.vmDetailsData[eventData.machineId].GUI.FirstRun = eventData.value;
							break;
							
					}
			}

		});

	},
	
	/**
	 * Start data mediator
	 */
	start: function() {
		
		vcube.vmdatamediator.watchEvents();
		
	},
	
	/**
	 * Get VM details data
	 * 
	 * @param vmid {String} ID of VM to get data for
	 * @param forceRefresh {Boolean} force refresh of VM data
	 * @returns {Object} vm data or promise
	 */
	getVMDetails: function(vmid, forceRefresh) {
		
		var vmData = vcube.storemanager.getStoreRecordData('vm', vmid);
		
		// Data exists
		if(vcube.vmdatamediator.vmDetailsData[vmid] && !forceRefresh) {
			
			return Ext.Object.merge({},vcube.vmdatamediator.vmDetailsData[vmid], vmData);
		}
		
		// Promise does not yet exist?
		if(!vcube.vmdatamediator.promises.getVMDetails[vmid]) {
			
			vcube.vmdatamediator.promises.getVMDetails[vmid] = Ext.create('Ext.ux.Deferred');

			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineGetDetails',vcube.utils.vmAjaxParams(vmid)))
			.fail(function(){
			
				vcube.vmdatamediator.promises.getVMDetails[vmid].reject('failed to get machine details');

				delete vcube.vmdatamediator.promises.getVMDetails[vmid];
			
			}).done(function(d){
				
				vcube.vmdatamediator.vmDetailsData[d.id] = d;
				vcube.vmdatamediator.promises.getVMDetails[vmid].resolve(Ext.Object.merge({}, d, vmData));
				
				delete vcube.vmdatamediator.promises.getVMDetails[vmid];
			
			});

		}		
		return vcube.vmdatamediator.promises.getVMDetails[vmid];
	},
	
	/**
	 * Get VM's runtime data
	 * 
	 * @param vmid {String} ID of VM to get data for
	 * @returns {Object} VM runtime data or promise
	 */
	getVMRuntimeData: function(vmid) {

		// Data exists
		if(vcube.vmdatamediator.vmRuntimeData[vmid]) {
			vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = null;
			return vcube.vmdatamediator.vmRuntimeData[vmid];
		}
		
		// Promise does not yet exist?
		if(!vcube.vmdatamediator.promises.getVMRuntimeData[vmid]) {
			
			vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = Ext.create('Ext.ux.Deferred');

			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineGetRuntimeData',vcube.utils.vmAjaxParams(vmid)))
				.done(function(d){
					vcube.vmdatamediator.vmRuntimeData[d.id] = d;
					if(vcube.vmdatamediator.promises.getVMRuntimeData[vmid])
						vcube.vmdatamediator.promises.getVMRuntimeData[vmid].resolve(d);
				}).fail(function(){
					if(vcube.vmdatamediator.promises.getVMRuntimeData[vmid])
						vcube.vmdatamediator.promises.getVMRuntimeData[vmid].reject('failed to get machine runtime data');
					vcube.vmdatamediator.promises.getVMRuntimeData[vmid] = null;
				});

		}		
		return vcube.vmdatamediator.promises.getVMRuntimeData[vmid];
	},
	
	/**
	 * Return all data for a VM
	 * @param vmid {String} ID of VM to get data for
	 * @returns promise
	 */
	getVMDataCombined : function(vmid) {
				
		var runtime = function() { return {};};
		var vmData = vcube.storemanager.getStoreRecordData('vm',vmid);
		if(vcube.utils.vboxVMStates.isRunning(vmData) || vcube.utils.vboxVMStates.isPaused(vmData)) {
			runtime = vcube.vmdatamediator.getVMRuntimeData(vmid);
		}
		
		var def = Ext.create('Ext.ux.Deferred');
		Ext.ux.Deferred.when(vcube.vmdatamediator.getVMDetails(vmid), runtime, vmData).done(function(d1,d2,d3){
			def.resolve(Ext.Object.merge({},d1,d2,d3));
		}).fail(function(){
			def.reject('getVMDetails, runtime or getVMData failed');
		});
		return def;
		
	}
	
});

