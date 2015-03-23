Ext.define('vcube.view.Menubar', {
	extend: 'Ext.panel.Panel',
    alias: 'widget.Menubar',
    items: [{
        xtype: 'toolbar',
        dock: 'top',
	    items : [
	       {
	    	   'xtype':'button',
	    	   'text':'File',
	    		'menu' : [
    		          {text:'Logout',itemId:'logout'}
	    		]
	       },
	       {
	    	   'xtype':'button',
	    	   'text':'Machine',
	    	   'menu' : []
	       },{
	    	   'xtype':'button',
	    	   'text':'Group',
	    	   'menu' : []
	       },{
	    	   'xtype':'button',
	    	   'text':'Help',
	    	   'menu' : []
	       }

	    ]
    }]
});