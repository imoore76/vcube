/**
 * Virtual Machine Snapshots tab
 * 
 */

Ext.define('vcube.view.VMSnapshots', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMSnapshots',
	
	statics: {
		
		// Snapshot node template
		snapshotTextTpl : "{0} <span class='vboxSnapshotTimestamp'>{1}</span>",
		
		// Current state node
		currentStateNode: function(vm) {
			return {
				text: '<strong>'+vcube.utils.trans((vm.currentStateModified ? 'Current State (changed)' : 'Current State'),'VBoxSnapshotsWgt')+'</strong>',
				icon : 'images/vbox/'+vcube.utils.vboxMachineStateIcon(vm.state),
				leaf : true,
				cls : 'snapshotCurrent',
				id : 'current'
			}
		},
		
		/* Snapshot tooltip */
		snapshotTip: function(s) {
			return '<strong>'+Ext.String.htmlEncode(s.name)+'</strong> ('+vcube.utils.trans((s.online ? 'online)' : 'offline)'),'VBoxSnapshotsWgt')+
				'<p>'+ vcube.utils.dateTimeString(s.timeStamp, vcube.utils.trans('Taken at %1','VBoxSnapshotsWgt'), vcube.utils.trans('Taken on %1','VBoxSnapshotsWgt'))+'</p>' +
				(s.description ? '<hr />' + Ext.util.Format.nl2br(Ext.String.htmlEncode(s.description)) : '');
		},
		
		/* Current state tooltip */
		currentStateTip: function(vm) {
			return '<strong>'+
	    		vcube.utils.trans((vm.currentStateModified ? 'Current State (changed)' : 'Current State'),'VBoxSnapshotsWgt') + '</strong><br />'+
	    		vcube.utils.trans('%1 since %2','VBoxSnapshotsWgt').replace('%1',vcube.utils.trans(vcube.utils.vboxVMStates.convert(vm.state),'VBoxGlobal'))
					.replace('%2',vcube.utils.dateTimeString(vm.lastStateChange))
				+ (vm.snapshotCount > 0 ? ('<hr />' + (vm.currentStateModified ?
							vcube.utils.trans('The current state differs from the state stored in the current snapshot','VBoxSnapshotsWgt')
							: vcube.utils.trans('The current state is identical to the state stored in the current snapshot','VBoxSnapshotsWgt')))
				: '');
		},
		
		snapshotNode: function(data, expanded) {
			return Ext.Object.merge({
				'loaded' : true,
				'text': Ext.String.format(vcube.view.VMSnapshots.snapshotTextTpl, Ext.String.htmlEncode(data.name), ''),
				'icon': 'images/vbox/snapshot_' + (data.online ? 'online' : 'offline') + '_16px.png',
				'expanded': expanded
			},data);
		},
		

		contextMenuItems: [
            vcube.actionpool.getAction('snapshots','take'),
            '-',
            vcube.actionpool.getAction('snapshots','restore'),
            vcube.actionpool.getAction('snapshots','delete'),
            '-',
            vcube.actionpool.getAction('snapshots','clone'),
            '-',
            vcube.actionpool.getAction('snapshots','show')			        
        ]

	},
	
	/* Snapshots */
	title: 'Snapshots',
	icon: 'images/vbox/snapshot_take_16px.png',
	layout: 'fit',
	frame: true,

	initComponent: function() {
		
		this.items = [{
			xtype: 'treepanel',
			itemId: 'snapshottree',
			tbarConfig : {
				hideText: true
			},
			viewConfig:{
				markDirty:false
			},
			rootVisible: false,
			lines: true,
			store: Ext.create('Ext.data.TreeStore',{
				fields: ['name','description','timeStamp','online','_skipTS','state','leaf','expanded','text','icon']
			}),
			dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'top',
			    itemId: 'snapshottoolbar',
			    listeners: {
			    	// remove text and make them tooltips
			    	afterrender: function(tbar) {
						Ext.each(tbar.items.items,function(item) {
							if(item.text) {
								item.setTooltip(item.text);
								item.setText('');
							}
						})
			    	}
			    },
			    defaults: { xtype: 'button', scale: 'medium' },
			    items: [
			            vcube.actionpool.getActionsAsBase('snapshots',['take'])[0],
			            '-',
			            vcube.actionpool.getActionsAsBase('snapshots',['restore'])[0],
			            vcube.actionpool.getActionsAsBase('snapshots',['delete'])[0],
			            '-',
			            vcube.actionpool.getActionsAsBase('snapshots',['clone'])[0],
			            '-',
			            vcube.actionpool.getActionsAsBase('snapshots',['show'])[0]			        

			            ]
			}]
		}];
		
		this.callParent();
	}
});


/**
 * Take snapshot dialog
 */
Ext.define('vcube.view.VMSnapshots.TakeSnapshot', {
	
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Take Snapshot of Virtual Machine','UIActionPool'),

    icon:'images/vbox/snapshot_take_16px.png',

    width:400,
    height: 240,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    
    items : [{
		frame:true,
		xtype: 'form',
		itemId: 'form',
		buttonAlign:'center',
		monitorValid:true,
		border: false,
		layout: {
			type: 'hbox'
		},
		items:[{
			xtype: 'image',
			height: 32,
			width: 32,
			itemId: 'osimage',
			margin: 10
		},{			
			flex: 1,
			layout: 'form',
			defaults: {
				labelAlign: 'top',
				labelSeperator: ''
			},
			bodyStyle: { background: 'transparent' },
			border: false,
			items: [{
				xtype: 'displayfield',
				value: vcube.utils.trans('Snapshot Name'),
				padding: '0 0 0 0',
				margin: '0 0 0 0',
				hideLabel: true
			},{
				xtype: 'textfield',
				name: 'name',
				allowBlank: false,
				hideLabel: true,
				width: 300
			},{
				xtype: 'displayfield',
				value: vcube.utils.trans('Snapshot Description'),
				padding: '0 0 0 0',
				margin: '0 0 0 0',
				hideLabel: true
			},{
				xtype: 'textareafield',
				hideLabel: true,
				name: 'description',
				width: 300
			}]	
		}],
		buttons:[{ 
			text: vcube.utils.trans('OK'),
			itemId: 'ok',
			formBind: true
		},{
			text: vcube.utils.trans('Cancel'),
			itemId: 'cancel',
			listeners: {
				click: function(btn) {
					btn.up('.window').close();
				}
			}
		}]
	}]
});



/**
 * Snapshot details dialog
 */
Ext.define('vcube.view.VMSnapshots.Details', {
	
    extend: 'Ext.window.Window',

    title: vcube.utils.trans('Snapshot Details','UIActionPool'),

    icon: 'images/vbox/snapshot_show_details_16px.png',

    width:600,
    height: 600,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',
    cls: 'snapshotDetails',
    items: [{
    	layout: {
    		type: 'vbox',
    		align: 'stretch'
    	},
    	items: [{
    		xtype: 'form',
    		itemId: 'form',
    		layout: 'form',
    		frame: true,
    		defaults: {
    			labelAlign: 'right'
    		},
    		listeners: {
    			validitychange: function(frm, valid) {
    				frm.owner.up('.window').down('#ok').setDisabled(!valid);
    			}
    		},
    		monitorValid:true,
    		buttonAlign:'center',
    		items: [{
    			xtype: 'textfield',
    			name: 'name',
    			allowBlank: false,
    			fieldLabel: vcube.utils.trans('Name'),
    			width: 300
    		},{
    			xtype: 'displayfield',
    			fieldLabel: vcube.utils.trans('Taken'),
    			value: '',
    			itemId: 'taken'
    		},{
    			fieldLabel: 'Preview',
    			xtype: 'displayfield',
    			itemId: 'preview',
    			value: ''
    		},{
    			xtype: 'textareafield',
    			fieldLabel: 'Description',
    			name: 'description',
    			anchor: '100%'
    		}]
    	},{
    		xtype: 'fieldset',
    		title: 'Details',
    		layout: 'fit',
			flex: 1,
			margin: 6,
			frame: true,
			cls: 'greyPanel',
			items: [{
				padding: 6,
				autoScroll: true,
				cls: 'greyPanel snapshotDetailsSection',
				itemId: 'details'				
			}]
		}]    			
    }],
	    
    buttons:[{ 
    	text: vcube.utils.trans('OK'),
    	itemId: 'ok',
    	disabled: true
    },{
    	text: vcube.utils.trans('Cancel'),
    	listeners: {
    		click: function(btn) {
    			btn.up('.window').close();
    		}
    	}
    }]

});


