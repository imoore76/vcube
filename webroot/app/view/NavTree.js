 /* 
 * view/NavTree
 */
Ext.define('vcube.view.NavTree', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.NavTree',
    
    statics: {
    	
    	/*
    	 * Generate VM tooltip
    	 */
    	vmTip: function(vm) {
    		
    	},
    	
    	/*
    	 * Generate server tooltip
    	 */
    	serverTip: function(server) {
    		
    	},
    	
    	/*
    	 * Generate group tooltip
    	 */
    	groupTip: function(group) {
    		
    	},
    	
    	/*
    	 * Generate VM node configuration
    	 */
    	vmNodeConfig: function(data) {
    		return {
    			cls : 'navTreeVM vmState'+ data.state+ ' vmSessionState' + data.sessionState
    					+ ' vmOSType' + data.OSTypeId,
    			text : data.name,
    			/*+ '<span class="navTreeVMState">'+
    				'<img src="images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state) +
    				'" height=16 width=16 valign=top style="margin-left: 24px"/></span>',*/
    			icon : (data.icon ? data.icon : 'images/vbox/' + vcube.utils.vboxGuestOSTypeIcon(data.OSTypeId)),
    			iconCls : 'navTreeIcon'
    		};
    	},
    	
    	/*
    	 * Generate VM group node configuration
    	 */
    	vmGroupNodeConfig: function(data) {
    		return {
    			iconCls : 'navTreeIcon',
    			text : Ext.String.htmlEncode(data.name)
    		};
    	},
    	
    	/*
    	 * Generate server node config
    	 */
    	serverNodeConfig: function(data) {
    		return {
    			iconCls : 'navTreeIcon',
    			icon : 'images/vbox/OSE/VirtualBox_cube_42px.png',
    			text : Ext.String.htmlEncode(data.name)
    					+ ' (<span class="navTreeServerStatus">'
    					+ vcube.app.constants.CONNECTOR_STATES_TEXT[data.state]
    					+ '</span>)'
    		}
    	},
    	
    	/*
    	 * Generate "Servers" node config
    	 */
    	serversNodeConfig: function() {
    		return {
    			cls : 'navTreeFolder',
    			text : 'Servers'    			
    		};
    	},
    	
    	/*
    	 * Generate "Virtual Machines" node config
    	 */
    	vmsNodeConfig: function() {
    		return {
    			cls : 'navTreeFolder',
    			text : 'Virtual Machines'		
    		}
    	},
    	
    	serverContextMenuItems: [
    	   // Add vm
    	   vcube.actionpool.getAction('server','addvm'),
    	   // new vm
    	   vcube.actionpool.getAction('server','newvm'),
    	   '-',
    	   // vbox settings
    	   vcube.actionpool.getAction('server','vbsettings'),
    	   '-',
    	   // remove
    	   vcube.actionpool.getAction('server','remove')
         ],
    	                         
    	machineContextMenuItems: [
    	
    	    // settings
    		vcube.actionpool.getAction('machine','settings'),
    		// clone
    		vcube.actionpool.getAction('machine','clone'),
    		// remove
    		vcube.actionpool.getAction('machine','remove'),
    		'-',
    		// start
    		vcube.actionpool.getAction('machine','start'),
    		// pause
    		vcube.actionpool.getAction('machine','pause'),
    		// reset
    		vcube.actionpool.getAction('machine','reset'),
    		// stop
    		Ext.Object.merge({},vcube.actionpool.getActionsAsBase('machine',['stop'])[0],{
    			menu: vcube.actionpool.getActions('machine',['savestate','powerbutton','poweroff'])
    		}),
    		
    		'-',
    		// discard
    		vcube.actionpool.getAction('machine','discard'),
    		// show logs
    		vcube.actionpool.getAction('machine','logs'),
    		'-',
    		// refresh
    		vcube.actionpool.getAction('machine','refresh')
	]
    	
    	
    },
    
    width: 300,
    cls: 'vcubeNavTree',
    rootVisible: false,
    lines: false,
    store: Ext.create('Ext.data.TreeStore',{
    	fields: [
    	  { name: 'id', type: 'string' },
    	  { name: 'rawid', type: 'string' },
    	  { name: 'name', type: 'string' },
    	  { name: 'group_id', type: 'string' },
    	  { name: 'parent_id', type: 'string' },
    	  { name: 'type', type: 'string' },
    	  { name: 'text', type: 'string' },
    	  { name: 'icon', type: 'string' },
    	  { name: 'iconCls', type: 'string' },
    	  { name: 'leaf', type: 'boolean' },
    	  { name: 'expanded', type: 'boolean' }
    	]
    }),
    useArrows: true,
    root: {
		allowDrag: false,
		allowDrop: false,
    	expanded: true
    },
    folderSort: true,
    viewConfig: {
    	markDirty:false,
    	plugins: {
	    	ptype: 'treeviewdragdrop',
	    	allowContainerDrop: false,
	    	allowParentInsert: false,
	    	ddGroup: 'navtreevms',
	    	appendOnly: true
    	}
	}
});
