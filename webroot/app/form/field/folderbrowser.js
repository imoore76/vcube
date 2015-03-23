Ext.define('vcube.form.field.folderbrowser', {
	
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.folderbrowser',
	layout: 'hbox',
	labelWidth: 150,
	labelAlign: 'right',
	fieldLabel: 'Folder',
	name: 'folder',
	browserTitle: 'Select folder...',
	
	initComponent: function(options) {
		
		Ext.apply(this, options);
		
		this.items = [{
			xtype: 'textfield',
			hideLabel: true,
			name: this.name,
			flex: 1
		},{
			xtype: 'button',
			icon: 'images/vbox/select_file_16px.png',
			height: 22,
			width: 22,
			margin: '1 0 0 2',
			padding: 2,
			handler: function(btn) {
				
				var txt = btn.up('.folderbrowser').items.items[0];
				
				var browser = Ext.create('vcube.widget.fsbrowser',{
					browserType: 'folder',
					serverId: btn.up('.window').serverId,
					title: this.browserTitle,
					initialPath: txt.getValue()
				});
				
				Ext.ux.Deferred.when(browser.browse()).done(function(f) {
					txt.setValue(f);
				});
				
			},
			scope: this
		}];
		
		this.callParent(arguments);
	}

});