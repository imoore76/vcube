Ext.define('vcube.controller.VMSnapshots', {
	
	extend: 'vcube.controller.XInfoTab',
	
	statics: {
	
		timer : null,
		
		// Max age of snapshot timestamps before we just display
		// a date for timestamp age
		maxAge: (86400 * 30),
		
		timeSpans : new Array(),
		
	    /* Get node title with time (currentTime passed so that it's cached) */
	    nodeTitleWithTimeString: function(name, timeStamp, currentTime) {
	    	
	    	// Shorthand
	    	var timeSpans = vcube.controller.VMSnapshots.timeSpans;
	    	
			var sts = parseInt(timeStamp);
			var t = Math.max(currentTime - sts, 1);
			
			var ts = '';
			
			// Check for max age.
			if(Math.floor(t / 86400) > 30) {
				
				var sdate = new Date(sts * 1000);
				ts = vcube.utils.trans(' (%1)','VBoxSnapshotsWgt').replace('%1',sdate.toLocaleString());
				
				
			} else {
				
				var ago = 0;
				var ts = 'seconds';
				for(var i in timeSpans) {
					var l = Math.floor(t / timeSpans[i]);
					if(l > 0) {
						ago = l;
						ts = i;
						break;
					}
				}
				switch(ts) {
				case 'days':
					ts = vcube.utils.trans('%n day(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;
				case 'hours':
					ts = vcube.utils.trans('%n hour(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;				
				case 'minutes':
					ts = vcube.utils.trans('%n minute(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;				
				case 'seconds':
					ts = vcube.utils.trans('%n second(s)', 'VBoxGlobal', ago).replace('%n', ago);
					break;				
				}
				
				ts = vcube.utils.trans(' (%1 ago)','VBoxSnapshotsWgt').replace('%1', ts);
				
			}
			
			return Ext.String.format(vcube.view.VMSnapshots.snapshotTextTpl, Ext.String.htmlEncode(name), ts)
	  	
	    }

	    
	},
	
    /* Watch for events */
    init: function(){
    	
    	/* Sort time spans */
    	vcube.controller.VMSnapshots.timeSpans['days'] = 86400;
        vcube.controller.VMSnapshots.timeSpans['hours'] = 3600;
        vcube.controller.VMSnapshots.timeSpans['minutes'] = 60;
        vcube.controller.VMSnapshots.timeSpans['seconds'] = 1;
    	vcube.controller.VMSnapshots.timeSpans.sort(function(a,b){return (a > b ? -1 : 1);});
    	
    	/* Setup sections */
    	this.sectionConfig = [];

    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = 'vm';
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = 'machineId';
    	    	
		// Special case for snapshot actions
		this.application.on({
			'MachineStateChanged': this.onMachineStateChanged,
			'SnapshotChanged': this.onSnapshotChanged,
			'SnapshotDeleted' : this.onSnapshotDeleted,
			'SnapshotTaken' : this.onSnapshotTaken,
			scope: this
		});
		
		
        
        this.control({
        	'viewport > #MainPanel > VMTabs > VMSnapshots' : {
        		render: this.onTabRender
        	},
        	'viewport > #MainPanel > VMTabs > VMSnapshots > treepanel' : {
        		selectionchange: this.updateActions
        	}
        });
        
        this.callParent();
        
    },
    
    
    // Snapshot tree and store refs
    snapshotTree: null,
    snapshotTreeStore: null,
    
    /* Sort function for snapshot tree */
    sortFn: function(snNode1, snNode2) {
    	if(snNode1.get('id') == 'current') return 1;
    	if(snNode2.get('id') == 'current') return -1;
    	if(snNode1.get('timeStamp') > snNode2.get('timeStamp')) return -1;
    	if(snNode2.get('timeStamp') > snNode2.get('timeStamp')) return 1;
    	return 0;
    },
    
    /* When a toolbar button or menu item is clicked */
    onActionClick: function(btn) {

    	if(!this.snapshotTree.getView().getSelectionModel().selected.length)
    		return;

    	vcube.actions.snapshots[btn.itemId].action(
    			this.snapshotTree.getView().getSelectionModel().getSelection()[0].getData(),
    			vcube.storemanager.getStoreRecordData('vm',this.selectionItemId),
    			this.snapshotTree.getRootNode());
    },
    
    /* Update buttons and menu items */
    updateActions: function() {
    	
    	var self = this;

    	// Snapshot data
    	var ss = null;
    	if(this.snapshotTree.getView().getSelectionModel().selected.length)
    		ss = this.snapshotTree.getView().getSelectionModel().getSelection()[0].getData();
    	
    	// vm data
    	var vm = vcube.storemanager.getStoreRecordData('vm',this.selectionItemId);


    	Ext.each(vcube.actionpool.getActions('snapshots'), function(action) {
    		action.setEnabledTest(ss, vm);
    	});
    	
    },
    
    /* Hold ref to snapshot tree store when tab is rendered 
     * and setup tooltips */
    onTabRender: function(tab) {
    	
    	var self = this;
    	
    	this.snapshotTree = tab.down('#snapshottree');
    	this.snapshotTreeStore = this.snapshotTree.getStore();
    	
        /* Setup handlers for snapshot actions */
    	Ext.each(vcube.actionpool.getActions('snapshots'), function(action) {
    		action.setHandler(self.onActionClick, self);
    	});

    	/* 
    	 * Context menu
    	 * 
    	 */
    	this.itemContextMenu = Ext.create('Ext.menu.Menu', {
    	    renderTo: Ext.getBody(),
    	    items: vcube.view.VMSnapshots.contextMenuItems
    	});

    	var self = this;
    	this.snapshotTree.on('itemcontextmenu',function(t,r,i,index,e) {
    		e.stopEvent();
    		self.itemContextMenu.showAt(e.getXY());

    	});

    	this.snapshotTree.on('beforeitemcontextmenu',function(t,snapshot) {
    		
    		Ext.each(self.itemContextMenu.items.items, function(i){
    			if(i.isDisabled()) i.hide();
    			else i.show();
    		});

    		var lastXtype = null;
			Ext.each(Ext.Array.filter(self.itemContextMenu.items.items, function(i) { return i.isVisible(); }),function(item, index, total){

				var xtype = item.getXType();
				if(item.xtype == 'menuseparator' && (lastXtype == 'menuseparator' || !lastXtype || index == (total.length-1))) {
					item.hide();
				} else {
					item.show();
				}
				lastXtype = xtype;
			});
    		

    	});
    	
    	/*
    	 * Snapshot tool tips 
    	 */
    	var snapshotTreeView = this.snapshotTree.getView();

    	this.snapshotTree.on('render', function(view) {
    		
    	    view.tip = Ext.create('Ext.tip.ToolTip', {
    	        // The overall target element.
    	        target: view.el,
    	        // Each grid row causes its own seperate show and hide.
    	        delegate: 'span.x-tree-node-text', //view.itemSelector,
    	        // Moving within the row should not hide the tip.
    	        trackMouse: true,
    	        // Render immediately so that tip.body can be referenced prior to the first show.
    	        renderTo: Ext.getBody(),
    	        listeners: {
    	            // Change content dynamically depending on which element triggered the show.
    	        	
    	            beforeshow: function (tip) {
    	            	
    	            	var record = snapshotTreeView.getRecord(Ext.get(tip.triggerEvent.target).findParentNode(snapshotTreeView.itemSelector));

    	            	if(!record) return false;
    	            	
    	            	if(record.get('id') =='current') {

    	            		tip.update(vcube.view.VMSnapshots.currentStateTip(
    	            				Ext.Object.merge({'snapshotCount':(snapshotTreeView.getStore().getCount()-1)},vcube.storemanager.getStoreRecordData('vm',self.selectionItemId), record.getData())
    	            				));
    	            		
    	            	} else {
    	            		
    	            		tip.update(vcube.view.VMSnapshots.snapshotTip(record.getData()));
    	            	}
    	            	
    	            }
    	        }
    	    });
    	});
    	
    	this.callParent(arguments);
    },
    
    /* Update current state when machine state changes */
    onMachineStateChanged: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    	var nodeCfg = vcube.view.VMSnapshots.currentStateNode(Ext.Object.merge({currentStateModified:true},vcube.storemanager.getStoreRecordData('vm',this.selectionItemId)));
    	this.snapshotTreeStore.getNodeById('current').set(nodeCfg);
    },
    
    /* Fires when a snapshot has been taken */
    onSnapshotTaken: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	// Append snapshot to current state's parent
    	this.snapshotTreeStore.getNodeById('current').parentNode.appendChild(vcube.view.VMSnapshots.snapshotNode(event.enrichmentData.snapshot));
    	
    	// Move current to child of just appended snapshot
    	this.snapshotTreeStore.getNodeById(event.enrichmentData.snapshot.id).appendChild(this.snapshotTreeStore.getNodeById('current'));
    	this.snapshotTreeStore.getNodeById(event.enrichmentData.snapshot.id).expand();
    	
    	// Update timestamps
    	this.updateTimestamps();
    	
    	
    	
    	
    },
    
    /* Update a snapshot when it has changed */
    onSnapshotChanged: function(event) {
    	
    	if(!this.filterEvent(event)) return;
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	
    	var targetNode = this.snapshotTreeStore.getNodeById(event.snapshotId);
    	
    	var currentTime = new Date();
    	currentTime = Math.floor(currentTime.getTime() / 1000);

    	targetNode.set({
    		'text' : vcube.controller.VMSnapshots.nodeTitleWithTimeString(event.enrichmentData.name, targetNode.getData().timeStamp, currentTime),
    		'name': event.enrichmentData.name,
    		'description': event.enrichmentData.description
    	});
    	
    	Ext.apply(targetNode.getData(),{name: event.enrichmentData.name, description: event.enrichmentData.description});
    	
    	
    },
    
    /* Remove snapshot when it has been deleted or move
     * current state when a snapshot has been restored */
    onSnapshotDeleted: function(event) {
    	
    	if(!this.filterEvent(event)) return;

    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}

    	// Snapshot deleted
    	if(event.snapshotId && event.snapshotId != '00000000-0000-0000-0000-000000000000') {
    		
    		var removeTarget = this.snapshotTreeStore.getNodeById(event.snapshotId);
    		
    		if(!removeTarget) return;
    		
    		var n = removeTarget.getChildAt(0);
    		
    		while(n) {
    			
    			removeTarget.parentNode.appendChild(n);//.remove());
    			n = removeTarget.getChildAt(0);
    		}
    		
    		removeTarget.parentNode.sort(this.sortFn);
    		removeTarget.parentNode.removeChild(removeTarget, true);

    	// Snapshot restored
    	} else {
    		this.snapshotTreeStore.getNodeById(event.enrichmentData.currentSnapshot).appendChild(this.snapshotTreeStore.getNodeById('current'));
    		this.snapshotTreeStore.getNodeById(event.enrichmentData.currentSnapshot).expand();
    	}
		
    	
    },

    
    /* Update snapshot timestamps */
    updateTimestamps: function() {
    	
    	
    	// Shorthand
    	var timeSpans = vcube.controller.VMSnapshots.timeSpans;
    	
    	// Keep minimum timestamp
    	var minTs = 60;

    	var currentTime = new Date();
    	currentTime = Math.floor(currentTime.getTime() / 1000);

    	function updateChildren(node) {
    		
    		
    		Ext.each(node.childNodes, function(childNode) {
    			
    			if(childNode.get('id') == 'current') return;


    			if(!childNode.get('_skipTS')) {
    				
    				minTs = Math.min(minTs,Math.max(parseInt(childNode.get('timeStamp')), 1));
    				
    				childNode.set('text', vcube.controller.VMSnapshots.nodeTitleWithTimeString(childNode.get('name'), childNode.get('timeStamp'), currentTime));
    				
    				if(currentTime - childNode.get('timeStamp') > vcube.controller.VMSnapshots.maxAge)
    					childNode.set('_skipTS',true);
    			}
    			
    			updateChildren(childNode);
    		});
    	}

    	
    	updateChildren(this.snapshotTreeStore.getRootNode());
    	
    	var timerSet = (minTs >= 60 ? 60 : 10);
    	var self = this;
    	vcube.controller.VMSnapshots.timer = window.setTimeout(function(){
    		self.updateTimestamps();
    	}, (timerSet * 1000));
    },

    /* Populate snapshot tree */
    populate: function(recordData) {

    	
    	if(vcube.controller.VMSnapshots.timer) {
    		window.clearTimeout(vcube.controller.VMSnapshots.timer);
    	}
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return;
    	}
    	
    	this.snapshotTree.getView().getSelectionModel().deselectAll();
    	this.updateActions();

    	// Data is no longer dirty
    	this.dirty = false;
    	
    	// Show loading mask
    	this.controlledTabView.setLoading(true);
    	
    	this.snapshotTreeStore.getRootNode().removeAll();
    	var self = this;
    	
    	
    	Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/machineGetSnapshots',vcube.utils.vmAjaxParams(recordData.id)))

    		.done(function(responseData) {
    		
	    		self.controlledTabView.setLoading(false);
	    		
	    		
	    		function appendChildren(parentNode, children) {
	    			if(!children) return;
	    			for(var i = 0; i < children.length; i++) {
	
	    				var childNodes = children[i].children;
	    				delete children[i].children;
	    				
	    				var child = parentNode.createNode(vcube.view.VMSnapshots.snapshotNode(children[i], (childNodes && childNodes.length)));
	    				
	    				if(childNodes) appendChildren(child, childNodes);
	    				
	    				child.sort(self.sortFn);
	    				parentNode.appendChild(child);
	    			}
	    		}
	
	    		if(responseData.snapshot && responseData.snapshot.id)
	    			appendChildren(self.snapshotTree.getRootNode(), [responseData.snapshot]);
	    		
	    		self.snapshotTree.getRootNode().sort(self.sortFn);
	    		
	    		// Append current state
	    		var appendTarget = self.snapshotTreeStore.getNodeById(responseData.currentSnapshotId);
	    		
	    		if(!appendTarget) appendTarget = self.snapshotTree.getRootNode();
	    		
	    		
	    		appendTarget.appendChild(
					appendTarget.createNode(
						vcube.view.VMSnapshots.currentStateNode(Ext.Object.merge({},vcube.storemanager.getStoreRecordData('vm',recordData.id), {currentSnapshotId: responseData.currentSnapshotId, currentStateModified: responseData.currentStateModified}))
					)
	    		);
	    		appendTarget.expand();
	    		
	    		
	    		// Expand
	    		self.snapshotTree.getRootNode().expand();
	    		self.updateTimestamps();
	    		
	    	})
	    	.fail(function() {
	    		self.controlledTabView.setLoading(false);
	    	});
    	
    }

});
