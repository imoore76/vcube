/**
 * Main viewport
 */
Ext.define('vcube.view.Viewport', {
    extend: 'Ext.container.Viewport',
    
    requires: [
          'vcube.view.TasksAndEvents',
          'vcube.view.NavTree',
          'vcube.view.Menubar',
          'vcube.view.Welcome',
          'vcube.view.GroupTabs',
          'vcube.view.VMTabs',
          'vcube.view.ServerTabs',
          'vcube.view.VirtualMachinesList'
   ],
   
   layout: 'border',
   
   items : [{
	   region: 'south',
	   height: 180,
	   xtype: 'TasksAndEvents',
	   split: true
   },{
	   region: 'west',
	   split: true,
	   xtype: 'NavTree'
   },{
	   region: 'north',
	   xtype: 'Menubar',
	   border: false
   },{
	   region: 'center',
	   layout: 'fit',
	   itemId: 'MainPanel',
	   flex: 1,
		defaults: {
			hidden: true,
			flex: 1,
			border: false,
			layout: 'fit'
		},
		items: [{
			xtype: 'Welcome',
			hidden: false
		},{
			xtype: 'ServerTabs'
		},{
			xtype: 'GroupTabs'
		},{
			xtype: 'VMTabs'
		},{
			xtype: 'VirtualMachinesList',
			title: '',
			icon: ''
		}]

   }]
});