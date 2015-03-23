Ext.define('vcube.view.ServerTabs', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.ServerTabs',
    
	requires: [
       'vcube.widget.SectionTable',
	   'vcube.view.ServerConnector',
	   'vcube.view.ServerHost',
	   'vcube.view.VirtualMachinesList',
       'vcube.view.TasksAndEvents'
     ],

    defaults: {
    	border: false,
    	padding: 5
    },    
    items: [{
    	xtype: 'ServerConnector'
    },{
    	xtype: 'ServerHost',
    },{
    	xtype: 'VirtualMachinesList',
    	layout: 'fit'
    },{
    	xtype: 'TasksAndEvents',
        title: 'Tasks and Events',
        icon: 'images/vbox/OSE/about_16px.png'
    }]
});