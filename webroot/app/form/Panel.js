/**
 * Form panel that uses vcube.form.Basic
 */
Ext.define('vcube.form.Panel',{

	extend: 'Ext.form.Panel',
	
	alias: 'widget.vcube.form.Panel',
	
	createForm: function() {
        return Ext.create('vcube.form.Basic', this, Ext.applyIf({listeners: {}}, this.initialConfig));
    }
})