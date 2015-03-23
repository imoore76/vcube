/*
 * Information tab controller parent class
 */
Ext.define('vcube.controller.XInfoTab', {
    extend: 'Ext.app.Controller',

    /* selection model ref */
    navTreeSelectionModel: null,

    refs : [{
    	selector: 'viewport > NavTree',
    	ref: 'NavTreeView'
    }],

	/* Repopulate everything on record change ? */
	repopulateOnRecrodChange: false,


    constructor: function() {
    	
    	
    	/* Does this tab need to be populated or redrawn? */
    	this.dirty = true;
    	
    	/* Currently selected item associated with this tab */
    	this.selectionItemId = null;
    	
    	/* Selection item type (vm|server|group) */
    	this.selectionItemType = null;
    	
    	/* selection node id */
    	this.selectionNodeId = null;
    	
    	/* Repopulate on Events*/
    	this.repopulateOn = [];
    	
    	/* Repopulate event attribute */
    	this.eventIdAttr = '-';
    	
    	/* Controlled Tab view instance */
    	this.controlledTabView = null;
    	
    	/* Point to section config */
    	this.sectionConfig = {};
    	    	
    	/* After new data is loaded */
    	this.callParent(arguments);
    	
    },
    

    /* Watch for events */
    init: function(){
    	
        this.control({
        	'viewport > NavTree' : {
        		selectionchange: this.onSelectionChange
        	}
        });
        
        
    	/* Get redraw events from sections */
		var redrawEvents = {};
		for(var i in this.sectionConfig) {
			
			if(typeof(i) != 'string') continue;
			
			var self = this;
			if(this.sectionConfig[i].redrawOnEvents) {
				Ext.each(this.sectionConfig[i].redrawOnEvents,function(event){
					redrawEvents[event] = self.onSubscribedEvent;
				});
			}
			if(this.sectionConfig[i].notifyEvents) {
				Ext.each(this.sectionConfig[i].notifyEvents,function(event){
					redrawEvents[event] = self.onSubscribedEvent;
				});
			}

			redrawEvents['scope'] = this;
		}		
		this.application.on(redrawEvents);
		
		/* Repopulate entire tab on these event */
		var repopulateEvents = {};
		for(var i = 0; i < this.repopulateOn.length; i++) {
			repopulateEvents[this.repopulateOn[i]] = this.onRepopulateEvent;
			repopulateEvents['scope'] = this;
		}

		this.application.on(repopulateEvents);
        
    },
    
    /* Get information population data */
    populateData : function() {
    	return {}
    },

    /* When this tab is rendered hold nav tree selection model */
    onTabRender: function(tab) {
    	this.controlledTabView = tab;
    	this.controlledTabView.on({'show':this.onTabShow,'scope':this});
    	this.navTreeSelectionModel = this.getNavTreeView().getSelectionModel();    
    	
    	// Subscribe to store changes
		vcube.storemanager.getStore(this.selectionItemType).on({'update':this.onRecordChanged,'scope':this});
    },
    
    /* Run when record has changed */
    onRecordChanged: function(store, record) {

    	if(this.selectionItemId != record.get('id'))
    		return;

    	console.log('here1');
    	if(this.repopulateOnRecrodChange) {
    		this.populate(record.getData());
    		return;
    	}
    	
    	var inf = this.getInfoPane();
    	
    	if(!inf) return;
    	
    	console.log('here2');
    	inf.update(record.getData());
    	console.log('here3');
    	
    },
    
    /* When tab is shown */
    onTabShow: function() {
    	
    	if(!this.dirty) return;
    	
    	this.populate(vcube.storemanager.getStoreRecordData(this.selectionItemType, this.selectionItemId));
    	
    },

    /* An selection in the tree has changed */
    onSelectionChange: function(panel, records) {

    	this.dirty = true;

    	if(records.length && records[0].get('type') == this.selectionItemType) {
    		
    		// Update node id
    		this.selectionNodeId = records[0].get('id');
    		
    		// Update selection item id
    		this.selectionItemId = records[0].get('rawid');
    		
    		// Populate
    		this.populate(vcube.storemanager.getStoreRecordData(this.selectionItemType,
    				this.selectionItemId));

    	} else {

    		// null these out
    		this.selectionNodeId = this.selectionItemId = null;

    	}

    },
    
    /* When a redraw event is encountered, a section is redrawn */
    onSubscribedEvent: function(event) {

    	if(!this.filterEvent(event)) return;

    	// Compose a list of sections that want to redraw
    	// on this type of event
    	var redrawSections = [];
    	var notifySections = [];
    	for(var i in this.sectionConfig) {
    		if(typeof(i) != 'string') continue;
			if(this.sectionConfig[i].redrawOnEvents && Ext.Array.contains(this.sectionConfig[i].redrawOnEvents, event.eventType)) {
				redrawSections.push(i);
			} else if(this.sectionConfig[i].notifyEvents && Ext.Array.contains(this.sectionConfig[i].notifyEvents, event.eventType)) {
				notifySections.push(i);
			}
    	}
    	
    	var self = this;

    	var sectionsPane = this.getSectionsPane();
    	var recordData = vcube.storemanager.getStoreRecordData(this.selectionItemType, this.selectionItemId);
    	
    	// Notify sections of event
    	if(notifySections.length) {
    		
    		Ext.each(sectionsPane.items.items, function(section, idx) {
    			
    			if(!Ext.Array.contains(notifySections, section.itemId)) {
    				return;
    			}
    			
    			sectionsPane.remove(section, true);
    			
    			sectionsPane.insert(idx, Ext.create('vcube.widget.SectionTable',{
    				sectionCfg: self.sectionConfig[section.itemId].onEvent(event, recordData),
    				'data':recordData,
    				'name':section.itemId}
    			));
    			
    		});

    	}
    	
    	// No sections to redraw, just return
    	if(!redrawSections.length) {
    		return;
    	}
    	
    	// Redraw each section that wants to be redrawn
    	
    	// Get fresh data
    	Ext.ux.Deferred.when(this.populateData(recordData)).done(function(data) {
			
    		// If this tab's item is no longer selected, nothing to do
        	if(data.id != self.selectionItemId)
        		return;
        	
        	// is this tab still visible?
        	if(!self.controlledTabView.isVisible()) {
        		self.dirty = true;
        		return;
        	}
        	
        	if(data == null) {
        		self.dirty = true;
        		return;
        	}
        	
	    	// Redraw each section that wants to be redrawn
	    	Ext.each(sectionsPane.items.items, function(section, idx) {
	    		
	    		if(!Ext.Array.contains(redrawSections, section.itemId)) {
	    			return;
	    		}
	    		
	    		sectionsPane.remove(section, true);
	    		
	    		sectionsPane.insert(idx, Ext.create('vcube.widget.SectionTable',{
	    			sectionCfg: self.sectionConfig[section.itemId],
	    			'data':Ext.Object.merge({},recordData,data),
	    			'name':section.itemId}
	    		));		
	    	});
	    	
	    	self.controlledTabView.doLayout();
			
		});

    },
    
    /* When a repopulate event is encountered, the
     * entire tab is repopulated */
    onRepopulateEvent: function(event) {

    	if(!this.filterEvent(event)) return;
    	
    	this.populate(vcube.storemanager.getStoreRecordData(this.selectionItemType, this.selectionItemId));

    	
    },
    
    /* Return true if this is an interesting event */
    filterEvent: function(event) {

    	// If the event isn't for this tab's item, there is nothing to do
    	if(event[this.eventIdAttr] != this.selectionItemId)
    		return false;

    	// is this tab still visible?
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		this.dirty = true;
    		return false;
    	}
    	
    	return true;

    },
    
    /* Get info table and cache result */
    _infoPane: false,
    getInfoPane: function() {
    	if(this._infoPane === false) {
    		this._infoPane = this.controlledTabView.down('#infopane')
    	}
    	return this._infoPane;
    },

    /* Get info sections and cache result */
    _sectionsPane: false,
    getSectionsPane: function() {
    	if(this._sectionsPane === false) {
    		if(this.controlledTabView.itemId == 'sectionspane') {
    			this._sectionsPane = this.controlledTabView; 
    		} else {
    			this._sectionsPane = this.controlledTabView.down('#sectionspane')
    		}
    	}
    	return this._sectionsPane;
    },

    /* Draw sections */
    drawSections: function(data, recordData) {

    	// Tab info table
    	var infoPane = this.getInfoPane();
    	if(infoPane) infoPane.update((data ? Ext.apply({}, data, recordData) : recordData));
    	
		// Tab section tables
		var sectionsPane = this.getSectionsPane();
		if(sectionsPane) {
			
			sectionsPane.removeAll(true);
			
			// Don't draw these if there is no data
			if(!data) return;
			
			data = Ext.apply({}, data, recordData);
			
			for(var i in this.sectionConfig) {
				
				if(typeof(i) != 'string') continue;
				
				if(this.sectionConfig[i].condition && !this.sectionConfig[i].condition(data)) continue;
				
				sectionsPane.add(Ext.create('vcube.widget.SectionTable',{
					sectionCfg: this.sectionConfig[i],
					'data': data,
					name: i}));
				
			}
		}

    },
    
    /* Populate tab */
    populate: function(recordData) {
    	
    	// Nothing to do if tab isn't visible
    	if(!(this.controlledTabView && this.controlledTabView.isVisible())) {
    		return;
    	}
    	
    	// Data is no longer dirty
    	this.dirty = false;
    	
    	// Show loading mask
    	this.controlledTabView.setLoading(true);
    	
    	// Hold ref to self
    	var self = this;
    	
    	Ext.ux.Deferred.when(this.populateData(recordData)).done(function(data) {
    	
    		
    		if(!self.controlledTabView.isVisible()) return;

    		// Is this node still selected
        	if(self.navTreeSelectionModel.getSelection()[0].get('id') != self.selectionNodeId)
        		return;
    		
    		// batch of updates
    		Ext.suspendLayouts();
    		
    		// draw sections with data
    		self.drawSections.apply(self, [data, recordData]);

    		// Remove loading mask
    		self.controlledTabView.setLoading(false);

    		// batch of updates are over
    		Ext.resumeLayouts(true);


    	}).always(function() {
    		
    		// No longer loading
    		self.controlledTabView.setLoading(false);
    		
    	});
    }

});
    
    
    
    