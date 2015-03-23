/**
 * 
 */
Ext.define('vcube.actionpool',{

	singleton: true,
	
	requires: [       
	   'vcube.Action',
       'vcube.actions.config',
       'vcube.actions.machine',
       'vcube.actions.server',
       'vcube.actions.snapshots',
       'vcube.actions.vmgroup'
    ],

    // Pool of actions
    actionPool : {},

    // Get a single action of type from pool
    getAction: function(type, action) {
    	return this.actionPool[type][action];
    },
    
    // Get the configuration of an action item
    getActionConfig: function(type, action) {
    	return {
    		text: vcube.actions.config[type][action].text,
    		icon: 'images/vbox/'+ vcube.actions.config[type][action].icon + '_16px.png'
    	}
    	
    },
    
    // Get all actions in list of type
    getActions: function(type, list) {
    	var actions = [];
    	var self = this;
    	var src = (list ? list : this.getActionList(type));
    	Ext.each(src, function(action) {
    		actions.push(self.getAction(type, action));
    	});
    	return actions;
    },
    
    // Get a list of action names
    getActionList: function(type) {
    	return vcube.actions.config[type]['actions'];
    },
    
    
    // Return a component with baseAction set to action
    // instance 
    getActionsAsBase: function(type, list) {

    	var returnList = [];
    	
    	var src = (list ? list : vcube.actions.config[type]['actions']);
    	
    	Ext.each(src, function(action) {
    	
    		var base = vcube.actionpool.getAction(type, action);

    		returnList.push({
    			itemId: base.initialConfig.itemId,
    			baseAction: base
    		});
    		
    	});
    	return returnList;
    },

    actionEnabled: function(type, action) {
    	return vcube.actions[type][action].enabled;
    },
    
    constructor: function() {
    	
    	var self = this;
    	
    	Ext.each(vcube.actions.config.actionTypes, function(type){
    		self.actionPool[type] = {};
    		Ext.each(vcube.actions.config[type]['actions'], function(action) {
    			self.actionPool[type][action] = Ext.create('vcube.Action',Ext.Object.merge({},{enabled_test:vcube.actions[type][action].enabled_test},vcube.actions.config[type][action]), action);
    		});
    	});
    	
    },

});