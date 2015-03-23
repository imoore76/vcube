/*
 * Events and tasks tab controller parent class
 */
Ext.define('vcube.controller.XVirtualMachinesList', {
	extend: 'Ext.app.Controller',


    /* Nav tree selection type and ID holder */
    selectionType: null,
    selectionId: null,
    
    /* machine list store */
    vmStore: null,
    
    /* Initially dirty */
    dirty: true,
    
    /* Pane that we are controlling */
    controlledList: null,
    
    /* VM record property which must match selection id */
    vmPropertyFilterProperty: null,
    
    init: function() {

    	this.controlledList = null;
    	this.vmStore = null;
    	
    	// Context menu copied from nav tree
    	if(!this.machineContextMenu)
	    	this.machineContextMenu = Ext.create('Ext.menu.Menu', {
	    	    renderTo: Ext.getBody(),
	    	    items: vcube.view.NavTree.machineContextMenuItems
	    	});


    	this.control({
    		// Nav tree selection change
    		'viewport > NavTree' : {
    			selectionchange: this.onSelectionChange
    		}
    		
    	});
    	
    	vcube.storemanager.getStore('vm').on('bulkremove', this.onVMStoreRecordsRemoved, this);
    	vcube.storemanager.getStore('vm').on('add', this.onVMStoreRecordsAdded, this);
    	
		this.callParent(arguments);

    },
    
    /* Set which VM list to control */
    setControlledList: function(list) {
    	
    	this.controlledList = list;
		
    	this.controlledList.on({'show':this.onShow,scope:this});
    	
    	this.vmStore = null;
    	this.vmStore = Ext.create('vcube.store.VirtualMachines');
    	
    	var grid = list.down('gridpanel');
    	
    	grid.reconfigure(this.vmStore); 
    	
		grid.on({
			// Any Virtual machine list gridpanel item context menu
			itemcontextmenu: function(grid,r,i,index,e) {
				e.stopEvent();
				this.machineContextMenu.showAt(e.getXY());
		    },
		    // show settings on dblclick
		    itemdblclick: function(grid,r,i,index,e) {
		    	if(vcube.actions.machine.settings.enabled_test(grid.getSelectionModel()))
		    		vcube.actions.machine.settings.action(grid.getSelectionModel())
		    },
		    scope: this
		});

		
    },
    
    /* Machines removed from main vm store */
    onVMStoreRecordsRemoved: function(store, records) {
    	(this.vmStore ? this.vmStore.remove(records) : null);
    },

    /* Machines added to main vm store */
    onVMStoreRecordsAdded: function(store, records) {
    	
    	if(!this.vmStore) return;
    	
    	var self = this;
    	var recordList = [];
    	Ext.each(records, function(record) {
    		if(self.machineListFilter(record.getData())) {
    			recordList.push(record);
    		}
    	});
    	this.vmStore.add(recordList);
    },


    /* When tab is shown */
    onShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.populate();

    },

    /* Filter for VMs in list */
    machineListFilter: function(vm) {
    	return (!this.vmPropertyFilterProperty || vm[this.vmPropertyFilterProperty] == this.selectionId)
    },

    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {
    	
    	this.dirty = true;
    	
    	if(records.length && records[0].get('type') == this.selectionType) {

    		this.selectionId = records[0].get('rawid');    		
    		this.populate();
    	
    	} else {
    	
    		this.selectionId = null;
    	}
    	

    },
    
    /* Return VM records matching filter */
    getVMRecords: function() {
    	
    	var self = this;
    	var records = [];
    	vcube.storemanager.getStore('vm').each(function(record) {
    		if(self.machineListFilter(record.getData()))
    			records.push(record);
    	});
    	return records;

    },
    
    /* Populate events */
    populate: function() {
    	
    	// is this tab still visible?
    	if(!(this.controlledList && this.controlledList.isVisible())) {
    		this.dirty = true;
    		return;
    	}
    	
    	this.dirty = false;
    	
    	this.vmStore.removeAll();
    	
    	this.vmStore.add(this.getVMRecords());
    	
		
    }




});