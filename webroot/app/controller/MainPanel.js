/*
 * Main Panel Controller
 */
Ext.define('vcube.controller.MainPanel', {
    extend: 'Ext.app.Controller',

    // View references
    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    },{
    	selector: 'viewport > #MainPanel > Welcome',
    	ref: 'WelcomeView'
    },{
    	selector: 'viewport > #MainPanel > GroupTabs',
    	ref: 'GroupTabsView'
    },{
    	selector: 'viewport > #MainPanel > ServerTabs',
    	ref: 'ServerTabsView'
    },{
    	selector: 'viewport > #MainPanel > VMTabs',
    	ref: 'VMTabsView'
    },{
    	selector: 'viewport > #MainPanel > VirtualMachinesList',
    	ref: 'VMListsView'
    }],
    
    /* Watch for events */
    init: function(){
    	
        /* Tree events */
        this.control({
        	'NavTree' : {
        		selectionchange: this.onSelectionChange
        	}
        });
    },
    
    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {
    	
    	if(records[0] && records[0].get('type') == this.lastItemType) return;
    	this.lastItemType = (records[0] ? records[0].get('type') : null);
    	
    	this.getWelcomeView().setVisible(!this.lastItemType);
    	this.getVMTabsView().setVisible(this.lastItemType == 'vm');
    	this.getGroupTabsView().setVisible(this.lastItemType == 'vmgroup');
    	this.getServerTabsView().setVisible(this.lastItemType == 'server');
    	this.getVMListsView().setVisible(this.lastItemType == 'vmsFolder');
    	

    }
 	
});