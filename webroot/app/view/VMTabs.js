/**
 * Virtual Machine tabs
 * 
 */

Ext.define('vcube.view.VMTabs', {
    
	extend: 'Ext.tab.Panel',
    
	alias: 'widget.VMTabs',
	
	requires: [
               'vcube.view.VMSummary',
               'vcube.view.VMDetails',
               'vcube.view.VMSnapshots',
               'vcube.view.VMConsole',
               'vcube.widget.SectionTable',
               'vcube.view.TasksAndEvents'
             ],
	
    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	xtype: 'VMSummary'
    },{
    	xtype: 'VMDetails'
    },{
    	xtype: 'VMSnapshots'
    },{
    	xtype: 'TasksAndEvents',
        title: 'Tasks and Events',
        icon: 'images/vbox/OSE/about_16px.png'
    },{
    	xtype: 'VMConsole'
    }]
});