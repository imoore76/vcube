Ext.define('vcube.view.GroupTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.GroupTabs',
    defaults: {
    	border: false,
    	layout: 'fit',
    	padding: 5
    },    
    items: [{
        title: 'Group Tab 1'
    },{
    	xtype: 'VirtualMachinesList',
    	layout: 'fit'
    }]
});