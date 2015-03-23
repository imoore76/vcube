/*
 * Events and tasks tabs
 */
Ext.define('vcube.view.TasksAndEvents', {
	extend: 'Ext.tab.Panel',
    alias: 'widget.TasksAndEvents',
    requires: ['vcube.grid.column'],
    filter: null,
    defaults: { viewConfig: { markDirty: false } },
    
    initComponent: function(config) {
    	
    	Ext.apply(this, config);
    	
    	this.eventStore = Ext.create('vcube.store.Events');
    	this.taskStore = Ext.create('vcube.store.Tasks');
    	
    	this.items = [{
    		title: 'Tasks',
    		xtype: 'gridpanel',
    		itemId: 'tasks',
    		store: this.taskStore,
    		columns: [{
    			xtype: 'tasknamecolumn',
    			width: 300
    		},{
    			xtype: 'logcategorycolumn',
    			width: 180
    		},{
    			header: 'Initiated by',
    			dataIndex: 'user'
    		},{
    			xtype: 'taskstatuscolumn'
    		},{ 
    			xtype: 'taskdetailscolumn',
    			flex: 1
    		},{
    			xtype: 'machinecolumn',
    			width: 150
    		},{
    			xtype: 'servercolumn',
    			width: 150
    		},{
    			header: 'Started',
    			dataIndex: 'started',
    			xtype: 'datecolumn',
    			format: 'Y-m-d H:i.s',
    			width: 150
    		},{
    			header: 'Completed',
    			dataIndex: 'completed',
    			xtype: 'datecolumn',
    			format: 'Y-m-d H:i.s',
    			width: 150
    		}]
    	},{
    		title: 'Events',
    		xtype: 'gridpanel',
    		itemId: 'events',
    		store: this.eventStore,
    		columns: [{ 
    			xtype: 'eventnamecolumn',
    			width: 300
    		},{
    			xtype: 'logcategorycolumn',
    			width: 180
    		},{
    			xtype: 'eventseveritycolumn'
    		},{ 
    			header: 'Details',
    			dataIndex: 'details',
    			renderer: function(v){
    				return Ext.String.htmlEncode(v);
    			},
    			flex: 1
    		},{
    			xtype: 'machinecolumn',
    			width: 150
    		},{ 
    			xtype: 'servercolumn',
    			width: 150
    		},{
    			header: 'Date',
    			dataIndex: 'time',
    			xtype: 'datecolumn',
    			format: 'Y-m-d H:i.s',
    			width: 150
    		}]
    	}]
    	
    	this.callParent(arguments);
    }

});

Ext.define('vcube.view.TasksAndEvents.TaskDetails', {
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Task Details'),

    icon: 'images/vbox/OSE/about_16px.png',

    width:400,
    height: 400,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',
    items: [{
	    frame:true,
	    xtype: 'form',
	    itemId: 'form',
	    defaults: { xtype: 'displayfield' },
	    buttonAlign:'center',
	    items: [{
	    	name: 'name',
	    	fieldLabel: vcube.utils.trans('Name')
	    },{
	    	name: 'status',
	    	fieldLabel: vcube.utils.trans('Status')
	    },{	    	
	    	name: 'user',
	    	fieldLabel: vcube.utils.trans('Initiated by')
	    },{
	    	name: 'category',
	    	fieldLabel: vcube.utils.trans('Category')
	    },{
	    	name: 'machine',
	    	fieldLabel: vcube.utils.trans('Machine')
	    },{
	    	name: 'connector',
	    	fieldLabel: vcube.utils.trans('Server')
	    },{
	    	name: 'details',
	    	fieldLabel: vcube.utils.trans('Details')
	    },{
	    	name: 'started',
	    	fieldLabel: vcube.utils.trans('Started')
	    },{
	    	name: 'completed',
	    	fieldLabel: vcube.utils.trans('Completed')
	    }]
    }],
	    
    buttons:[{ 
    	text: vcube.utils.trans('OK'),
    	listeners: {
    		click: function(btn) { btn.up('.window').close(); }
    	}
    }]

});
	

Ext.define('vcube.view.TasksAndEvents.EventDetails', {
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Event Details'),

    icon: 'images/vbox/OSE/about_16px.png',

    width:400,
    height: 300,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',
    items: [{
	    frame:true,
	    xtype: 'form',
	    itemId: 'form',
	    defaults: { xtype: 'displayfield' },
	    buttonAlign:'center',
	    items: [{
	    	name: 'name',
	    	fieldLabel: vcube.utils.trans('Name')
	    },{
	    	name: 'severity',
	    	fieldLabel: vcube.utils.trans('Severity')
	    },{	    	
	    	name: 'category',
	    	fieldLabel: vcube.utils.trans('Category')
	    },{
	    	name: 'machine',
	    	fieldLabel: vcube.utils.trans('Machine')
	    },{
	    	name: 'connector',
	    	fieldLabel: vcube.utils.trans('Server')
	    },{
	    	name: 'details',
	    	fieldLabel: vcube.utils.trans('Details')
	    },{
	    	name: 'time',
	    	fieldLabel: vcube.utils.trans('Time')
	    }]
    }],
	    
    buttons:[{ 
    	text: vcube.utils.trans('OK'),
    	listeners: {
    		click: function(btn) { btn.up('.window').close(); }
    	}
    }]

});

