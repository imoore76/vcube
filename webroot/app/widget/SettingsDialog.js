/**
 * Settings dialog widget
 */
Ext.define('vcube.widget.SettingsDialog',{

	extend: 'Ext.window.Window',
	alias: 'widget.SettingsDialog',
	
	requires: ['vcube.form.field.slider', 'vcube.form.field.bootorder', 'vcube.form.Basic','vcube.form.Panel'],
	
    title: vcube.utils.trans('Settings'),
    icon: 'images/vbox/vm_settings_16px.png',
    layout:'fit',
    width:700,
    height: 460,
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,

    items : [{
    	layout: {
    		type: 'hbox',
    		pack: 'start',
    		align: 'stretch'
    	},
    	items: [{
    		itemId: 'linklist',
    		cls: 'settingsLinkList',
    		border: false,
    		frame: true,
    		defaults: {
    			xtype: 'button',
    			margin: '0 0 4 0',
    			toggleGroup: 'settingsPaneSelection',
    			border: false,
    			textAlign: 'left',
    			height: 24,
    			padding: 2,
    		},
    		layout: {
    			type: 'vbox',
    			pack: 'start',
    			align: 'stretch'
    		},
    		items: []
    	},{
    		itemId: 'settingsPane',
    		flex: 1,
    		xtype: 'vcube.form.Panel',
    		fieldDefaults: {
    			labelAlign: 'right'
    		},
    		layout: 'fit',
    		padding: 4,
    		border: false,
    		defaults : {
    			border: false,
    			autoScroll: true,
    			hidden: true,
    			frame: true,
    			padding: 6,
    			defaults: {
    				frame: true,
    				padding: 6,
    				layout: 'form',
    	    		fieldDefaults: {
    	    			labelAlign: 'right'
    	    		}
    			}
    		},
    		items: []
    	}]
    }],
    
    buttons : [{
    	text: 'Save',
    	itemId: 'save'
    },{
    	text: 'Cancel',
    	itemId: 'cancel'
    }]
    
});