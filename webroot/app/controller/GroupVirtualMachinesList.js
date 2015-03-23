/*
 * Events and tasks controller
 */
Ext.define('vcube.controller.GroupVirtualMachinesList', {
    extend: 'vcube.controller.XVirtualMachinesList',
    
    /* Nav tree selection type field */
    selectionType: 'vmgroup',

    /* VM record property which must match selection id */
	vmPropertyFilterProperty: 'group_id',
	
	// Hold nav tree ref so that we only have to get this once
	refs : [{
		selector : 'viewport > NavTree',
		ref : 'NavTreeView'
	}],

	/* groupids that must match */
	groupIds: [],

    /* Watch for events */
    init: function() {

    	this.control({
    		
        	'viewport > #MainPanel > GroupTabs > VirtualMachinesList' : {
    			render: function(panel) {
    				this.setControlledList(panel)
    			}
        	},
    	
    		'viewport > NavTree' : {
    			render: function(panel) {
    				panel.getStore().on('remove',this.navTreeItemRemoved, this);
    				panel.getStore().on('insert',this.navTreeItemAdded, this);
    				panel.getStore().on('move',this.navTreeItemMoved, this);
    			},
    			selectionchange: this.onNavTreeSelectionChange
    		}
        });
    	
    	this.callParent(arguments);
    },
    
    navTreeItemRemoved: function(store, node) {
    	console.log("Removed");
    },
    
    navTreeItemAdded: function(store, records) {
    	console.log("Added");
    },
    
    navTreeItemMoved: function(node, oldParent, newParent) {
    	console.log("Moved");
    },
    
    /* Get sub vms when selection changes */
    onNavTreeSelectionChange: function(sm, records) {
    	
    	if(records.length && records[0].get('type') == 'vmgroup') {

    		var groupIdList = [records[0].get('rawid')];
    		
    		var store = this.getNavTreeView().getStore();
    		
    		function getChildGroups(node) {

    			node.eachChild(function(childNode){
    				if(childNode.get('type') == 'vmgroup') {
    					groupIdList.push(childNode.get('rawid'));
    					getChildGroups(childNode);
    				}
    				
    			});
    		}
    		
    		getChildGroups(this.getNavTreeView().getStore().getNodeById(records[0].get('id')));
    		this.groupIds = groupIdList;
    		
    	}

    },
    
    /* vms would be any group or sub-group vms */
    machineListFilter: function(vm) {
		return Ext.Array.contains(this.groupIds, String(vm.group_id));
    }

});


