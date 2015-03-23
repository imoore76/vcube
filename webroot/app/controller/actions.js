/*
 * Update machine actions list
 */
Ext.define('vcube.controller.actions', {
	
	extend : 'Ext.app.Controller',
	
	/**
	 * Nav tree selection change ->
	 * 
	 * 	Group -> update group actions
	 *  Server -> update server actions
	 *  VM -> update VM actions
	 *  
	 *  nav tree item change:
	 *  
	 *  group -> update group actions
	 *  server -> update server actions
	 *  VM -> update VM actions
	 *  
	 *  There will be a VM selection model - 
	 *  	this will be a pointer to nav tree
	 *  	selection model if this is selected
	 *  
	 *  If a VM list is shown, this will point to
	 *  	the vm list selection model
	 *  
	 *  selectedVMIds will always be populated with the
	 *  	contents of the VM selection model or the 
	 *  	selected nav tree vm
	 *  
	 *  We'll have to watch for datachanged event on the
	 *  	grids, and on the single selected nav tree item
	 * 
	 */
	
	// ids of selected vms
	selectedVMIds : [],
	
	// Current selection model we are using for VMs
	vmSelectionModel: null,
	
	// Main nav-tree selection model
	navTreeSelectionModel: null,
	
	// Selected nav tree record
	navTreeSelectedRecord: null,
	
	/* Watch nav tree and vm list selections */
	init : function() {

        this.control({
        	
        	// Main navigation tree
			'viewport > NavTree' : {
				render: function(panel) {
					this.navTreeSelectionModel = panel.getView().getSelectionModel();
					this.vmSelectionModel = panel.getView().getSelectionModel();
				},
				selectionchange: this.onSelectionChangeNavTree
			},
			
			// Any Virtual machine list gridpanel selection change
			'VirtualMachinesList > gridpanel': {
				selectionchange: this.onVMSelectionChange
			},
			
			// Any time a VM list is shown
			'VirtualMachinesList': {
				show: this.onMachineListShow
			},
			'.tabpanel > VirtualMachinesList': {
				render: function(panel) {
					panel.ownerCt.on('show', this.onMachineListShow, this);
				}
			}
			
        });
        

		// This is the master handler for all actions of these types
		var self = this;
		Ext.each(vcube.actionpool.getActions('machine'), function(action) {
			action.setHandler(function(btn){
				vcube.actions.machine[btn.itemId]['action'](self.vmSelectionModel);
			});
		});
		Ext.each(vcube.actionpool.getActions('server'), function(action) {
			action.setHandler(function(btn){
				vcube.actions.server[btn.itemId]['action'](self.navTreeSelectionModel);
			});
		});
		Ext.each(vcube.actionpool.getActions('vmgroup'), function(action) {
			action.setHandler(function(btn){
				vcube.actions.vmgroup[btn.itemId]['action'](self.navTreeSelectionModel);
			});
		});
		
		// Watch for changes that will affect actions
		vcube.storemanager.getStore('server').on('update', this.onStoreRecordUpdated, this, {type:'server'});
		vcube.storemanager.getStore('vm').on('update', this.onStoreRecordUpdated, this, {type:'vm'});
		vcube.storemanager.getStore('vmgroup').on('update', this.onStoreRecordUpdated, this, {type:'vmgroup'});		
        
	},
	
	/* Changes that should update actions */
	onStoreRecordUpdated: function( store, record, operation, modifiedFieldNames, eOpts ) {
		
		if(operation != Ext.data.Model.EDIT) return;
		
		if(!this.navTreeSelectedRecord) return;
		
		if(this.navTreeSelectedRecord.get('type') != eOpts.type) return;
		
		switch(eOpts.type) {
	
			case 'server':
				if(this.navTreeSelectedRecord.get('rawid') == record.get('id'))
					this.updateServerActions();
				break;

			case 'vm':
				if(Ext.Array.contains(this.selectedVMIds, record.get('id')))
					this.updateVMActions();
				break;
			
			case 'vmgroup':
				break;
		}
		
	},
	
	/* A machine list is shown */
	onMachineListShow: function(panel) {
		
		// fake a selection change
		this.vmSelectionModel = panel.down('.gridpanel').getSelectionModel();
		this.onVMSelectionChange(this.vmSelectionModel, this.vmSelectionModel.getSelection());
		
		
	},
	
	/* Update vm action list */
	onMachineChange: function(eventData) {
		
    	// Is this VM still selected
    	if(!Ext.Array.contains(this.selectedVMIds, eventData.machineId))
    		return;
    	
    	this.updateVMActions();

	},
	
	/* Update server actions */
	onServerChange: function(eventData) {
		
		var sel = this.navTreeSelectionModel.getSelection();
		if(sel.length && sel[0].get('type') == 'server' && String(sel[0].get('rawid')) == String(eventData.connector_id)) {
			this.updateServerActions();
		}
		
	},
	
	/* Nav tree selection changed */
	onSelectionChangeNavTree: function(selectionModel, records) {
		
		this.navTreeSelectedRecord = (records.length ? records[0] : null);
		
		if(records.length && records[0].get('type') == 'vm') {

			this.vmSelectionModel = selectionModel;
			this.onVMSelectionChange(selectionModel, records);
		
		} else {
			this.selectedVMIds = [];
		}
		
		if(!records.length) return;
		
		if(records[0].get('type') == 'server')
			this.updateServerActions();
		
	},
	
	/* Selection has changed, update actions and hold VM ids */
	onVMSelectionChange: function(selectionModel, records) {
		this.selectedVMIds = Ext.Array.map(records, function(r) { return r.get('id'); });		
		this.updateVMActions();
	},
	
	/* Update actions */
	updateVMActions: function() {
		
		var self = this;
		Ext.each(vcube.actionpool.getActionList('machine'),function(actionName) {
			vcube.actionpool.getAction('machine',actionName).setEnabledTest(self.vmSelectionModel);
		});

	},
	
	/* Update server actions */
	updateServerActions: function() {
		
		var self = this;
		Ext.each(vcube.actionpool.getActionList('server'),function(actionName) {
			vcube.actionpool.getAction('server',actionName).setEnabledTest(self.navTreeSelectionModel);
		});
	}

});

