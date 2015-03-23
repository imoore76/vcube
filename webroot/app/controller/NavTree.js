/*
 * NavTree Controller
 */
Ext.define('vcube.controller.NavTree', {
	
	extend : 'Ext.app.Controller',

	// Hold nav tree ref so that we only have to get this once
	refs : [{
		selector : 'viewport > NavTree',
		ref : 'NavTreeView'
	}],

	/* Watch for events */
	init : function() {

		/* Application level events */
		this.application.on({
			
			start : this.populateTree,			
			scope : this
		
		});

		/* Tree events */
		this.control({
			
			'viewport > NavTree' : {
				
				render: function(tv) {
					
				
					tv.getView().on('drop', this.itemDropped, this);
					this.selectionModel = tv.getView().getSelectionModel();
					
			    	machineContextMenu = Ext.create('Ext.menu.Menu', {
			    	    renderTo: Ext.getBody(),
			    	    items: vcube.view.NavTree.machineContextMenuItems
			    	});

			    	serverContextMenu = Ext.create('Ext.menu.Menu', {
			    	    renderTo: Ext.getBody(),
			    	    items: vcube.view.NavTree.serverContextMenuItems
			    	});
			    	
			    	var self = this;
			    	tv.on('itemcontextmenu',function(t,r,i,index,e) {
			    		e.stopEvent();
			    		switch(r.get('type')) {
				    		case 'server':
				    			serverContextMenu.showAt(e.getXY());
				    			break;
			    			case 'vm':
			    				machineContextMenu.showAt(e.getXY());
			    				break;
			    		}

			    	});

				}
			}
		});
		

		/* Subscribe to storemanager events */
		
	},
	
	/** Common refs */
	navTreeView : null,
	navTreeStore : null,
	rootNode : null,
	serversNode : null,
	vmsNode : null,
	selectionModel: null,

	/*
	 * Sort function
	 */
	sortCmp: function(a, b) {
		
		if(a.get('type') == b.get('type')) {
			return vcube.utils.strnatcasecmp(a.get('name'), b.get('name'));
		} else if(a.get('type') == 'vm') {
			return 1;
		} else {
			return -1;
		}
	},
	
	/*
	 * Node (vm or vmgroup) is dropped
	 */
	itemDropped: function (node, droppedItems, dropRec, dropPosition) {
		
		var targetId = (dropRec.get('id') == 'vmsFolder' ? 0 : dropRec.get('rawid'));
		
		Ext.each(droppedItems.records, function(item){
			var itemid = item.get('rawid');
			if(item.get('type') == 'vm') {
				vcube.utils.ajaxRequest('vbox/machineSetGroup',Ext.apply({'group':targetId},vcube.utils.vmAjaxParams(itemid)));
			} else {
				vcube.utils.ajaxRequest('vmgroups/updateGroup',{'id':itemid,'parent_id':targetId});
			}
		});
		
		dropRec.sort(this.sortCmp, false);
    },
	
	/*
	 * Data loading functions
	 * 
	 */
	createServerNodeConfig : function(data) {

		return Ext.apply({
			leaf : true,
			allowDrag: false,
			allowDrop: false,
			rawid : data.id,
			type : 'server',
			id : 'server-' + data.id,
			name: data.name
		},vcube.view.NavTree.serverNodeConfig(data));
		
	},
	
	createVMNodeConfig : function(data) {

		return Ext.apply({
			id: data.id,
			rawid: data.id,
			group_id: data.group_id,
			type: 'vm',
			leaf: true,
			name: data.name
		},vcube.view.NavTree.vmNodeConfig(data));
	},
	
	createVMGroupNodeConfig: function(data) {

		return Ext.apply({
			leaf : false,
			expanded: true,
			id : 'vmgroup-' + data.id,
			type: 'vmgroup',
			parent_id : data.parent_id,
			rawid: data.id,
			name: data.name
		},vcube.view.NavTree.vmGroupNodeConfig(data));

	},
	
	/**
	 * Add server to Servers node
	 */
	addServer : function(data) {
		this.serversNode.appendChild(this.serversNode.createNode(this.createServerNodeConfig(data)));
		return this.serversNode;
	},

	/**
	 * Add a group to the VMs node
	 */
	addVMGroup : function(data) {

		appendTarget = (data.parent_id ? this.navTreeStore.getNodeById('vmgroup-'+ data.parent_id) : this.vmsNode);

		if (!appendTarget)
			appendTarget = this.vmsNode;

		appendTarget.appendChild(appendTarget.createNode(this.createVMGroupNodeConfig(data)));
		
		return appendTarget;


	},
	
	/**
	 * Add a VM somewhere under the VMs node
	 */
	addVM : function(data) {

		appendTarget = (data.group_id ? this.navTreeStore.getNodeById('vmgroup-' + data.group_id) : this.vmsNode);

		if (!appendTarget)
			appendTarget = this.vmsNode;

		appendTarget.appendChild(appendTarget.createNode(this.createVMNodeConfig(data)));
		
		return appendTarget;

	},


	/** 
	 * Records added to managed store
	 */
	onStoreRecordsAdded: function(store, records, index, eOpts) {
		
		var self = this,
			addFn = null;
		
		switch(eOpts.type) {
			case 'vm':
				addFn = this.addVM;
				break;
			case 'vmgroup':
				addFn = this.addVMGroup;
				break;
			case 'server':
				addFn = this.addServer;
				break;
		}
		var sortNodes = [];
		var sorted = {};
		Ext.each(records, function(record) {
			sortNodes.push(addFn.call(self, record.getData()));
		});
		Ext.each(sortNodes, function(node) {
			if(!sorted[node.get('id')]) {
				sorted[node.get('id')] = true;
				node.sort(self.sortCmp);
			} 
		});
		
	},
	
	/**
	 * Records removed from managed store
	 */
	onStoreRecordsRemoved: function(store, records, indexes, isMove, eOpts) {
		
		var nodeIdPrefix = '';
		if(eOpts.type == 'server' || eOpts.type == 'vmgroup')
			nodeIdPrefix = eOpts.type + '-';
		
		var self = this;
		Ext.each(records, function(record) {
			var node = self.navTreeStore.getNodeById(nodeIdPrefix + record.get('id'));
			if(!node) return;
			node.removeAll(true);
			node.remove(true);
		});
		
		// TODO: Trigger change on each parent
	},
	
	/**
	 * Record in store updated
	 */
	onStoreRecordUpdated: function( store, record, operation, modifiedFieldNames, eOpts ) {
		
		if(operation != Ext.data.Model.EDIT) return;
		
		var targetNode = this.navTreeStore.getNodeById((eOpts.type != 'vm' ? eOpts.type + '-' : '') + record.get('id'));
		
		switch(eOpts.type) {
			
			/*
			 * Server change
			 */
			case 'server':
				targetNode.set(this.createServerNodeConfig(record.getData()));
				break;
			
			/*
			 * VM change
			 */
			case 'vm':
				
				var oldGroup = targetNode.get('group_id');
				var newGroup = record.get('group_id');
				
				
				targetNode.set(this.createVMNodeConfig(record.getData()));
				
				// Special case if group changed
				if(oldGroup != newGroup) {
				
					var targetGroup = this.navTreeStore.getNodeById('vmgroup-' + parseInt(newGroup));
					
					if(!targetGroup) return;
					
					targetGroup.appendChild(targetNode);
					
					targetGroup.sort(this.sortCmp, false);
					
					// no need to sort parent group because we
					// were removed from it
					return;
				}
				break;
				
			/*
			 * VM group change
			 */
			case 'vmgroup':
				
				var oldGroup = targetNode.get('parent_id');
				var newGroup = record.get('parent_id');
				
				targetNode.set(this.createVMGroupNodeConfig(record.getData()));
				
				// Special case if parent group changed
				if(oldGroup != newGroup) {
					
					var targetGroup = this.navTreeStore.getNodeById('vmgroup-' + parseInt(newGroup));
					
					if(!targetGroup) return;
					
					targetGroup.appendChild(targetNode);
					
					targetGroup.sort(this.sortCmp, false);
					
					// no need to sort parent group because we
					// were removed from it
					return;
				}
				
				break;
				
		}
		targetNode.parentNode.sort(this.sortCmp);

	},
	
	/* Populate navigation tree */
	populateTree : function() {

		this.navTreeView = this.getNavTreeView();
		this.navTreeStore = this.navTreeView.getStore();
		
		// Show load mask
		this.navTreeView.setLoading();

		// Nav tree root reference
		this.rootNode = this.navTreeView.getRootNode();
		

		// Add servers folder
		this.serversNode = this.rootNode.createNode(Ext.apply({
			leaf : false,
			id : 'servers',
			allowDrag: false,
			allowDrop: false,
			type: 'serversFolder'
		}, vcube.view.NavTree.serversNodeConfig()));
		
		this.rootNode.appendChild(this.serversNode);

		// Add virtual machines folder
		this.vmsNode = this.rootNode.createNode(Ext.apply({
			leaf : false,
			id : 'vmgroup-0',
			allowDrag: false,
			type: 'vmsFolder',
			rawid: 'vmgroup-0'
		}, vcube.view.NavTree.vmsNodeConfig()));
		
		this.rootNode.appendChild(this.vmsNode);

		var self = this;

		/*
		 * 
		 * Load all tree data and subscribe to store changes
		 * 
		 */

		
		// Servers
		vcube.storemanager.getStore('server').each(function(record) {
			self.addServer(record.getData());
		});
		
		vcube.storemanager.getStore('server').on('add', this.onStoreRecordsAdded, this, {type:'server'});
		vcube.storemanager.getStore('server').on('bulkremove', this.onStoreRecordsRemoved, this, {type:'server'});
		vcube.storemanager.getStore('server').on('update', this.onStoreRecordUpdated, this, {type:'server'});
		
		// VM Groups
		vcube.storemanager.getStore('vmgroup').each(function(record) {
			self.addVMGroup(record.getData());
		});
		
		vcube.storemanager.getStore('vmgroup').on('add', this.onStoreRecordsAdded, this, {type:'vmgroup'});
		vcube.storemanager.getStore('vmgroup').on('bulkremove', this.onStoreRecordsRemoved, this, {type:'vmgroup'});
		vcube.storemanager.getStore('vmgroup').on('update', this.onStoreRecordUpdated, this, {type:'vmgroup'});

		// VMs
		vcube.storemanager.getStore('vm').each(function(record) {
			self.addVM(record.getData());
		});
		
		vcube.storemanager.getStore('vm').on('add', this.onStoreRecordsAdded, this, {type:'vm'});
		vcube.storemanager.getStore('vm').on('bulkremove', this.onStoreRecordsRemoved, this, {type:'vm'});
		vcube.storemanager.getStore('vm').on('update', this.onStoreRecordUpdated, this, {type:'vm'});

		// Sort and expand
		this.rootNode.sort(this.sortCmp, true);
		this.rootNode.expand(true);

		
		// Hide load mask
		this.navTreeView.setLoading(false);

	}
});