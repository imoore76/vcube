/*
 * Main Panel Controller
 */
Ext.define('vcube.controller.SettingsDialog', {
    extend: 'Ext.app.Controller',
    
    init: function() {
    	
    	this.control({
    		
    		'SettingsDialog' : {
    			show: this.onShow
    		},
    		
    		'SettingsDialog #cancel' : {
    			click: function(btn) {
    				btn.up('.window').close();
    			}
    		},

    		'SettingsDialog #linklist > button' : {
    			toggle: this.buttonToggle
    		}
    	});
    	
    },
    
    /* when dialog is shown */
    onShow: function(dlg) {
    	
    	dlg.setLoading(true);
    	
    	var linkList = dlg.down('#linklist');
    	var settingsPane = dlg.down('#settingsPane');
    	
    	/* Add sections and get data to be loaded */
    	Ext.suspendLayouts();
    	
    	Ext.ux.Deferred.when(vcube.utils.ajaxRequest(dlg.dialogDataURL,{connector:dlg.serverId})).done(function(data) {
    		
    		var sections = dlg.getSections(data);
    		
    		for(var i = 0; i < sections.length; i++) {
    			
    			
    			linkList.add({
    				text: sections[i].label,
    				icon: 'images/vbox/' + sections[i].image + '_16px.png',
    				itemId : sections[i].name
    			});
    			
    			sections[i].title = sections[i].label,
    			sections[i].itemId = sections[i].name;
    			
    			settingsPane.add(sections[i]);
    			
    		}
    		
    		dlg.down('#linklist').items.items[0].toggle(true);

    		Ext.resumeLayouts();
    		
    		Ext.ux.Deferred.when(dlg.getFormData()).done(function(frmData) {
    			dlg.down('.form').getForm().setValues(frmData);
    			dlg.setLoading(false);    			
    		}).fail(function(){
    			dlg.setLoading(false);
    		});
    		
    	}).fail(function() {
    		dlg.setLoading(false);
    		Ext.resumeLayouts();
    	});
    	
    	
    },
    
    /* Settings pane button toggled (clicked) */
    buttonToggle: function(btn, state) {
    	
		// Do not untoggle this button if no other
		// button is pressed
		if(state == false) {
			var oneToggled = false;
			Ext.each(btn.ownerCt.items.items, function(obtn) {
				if(obtn.pressed) {
					oneToggled = true;
					return false;
				}
			});    			
			if(!oneToggled) {
				btn.toggle(true, true);
				return;
			}
			
		} else {
			
			var settingsPane = btn.up('.SettingsDialog').down('#settingsPane');
			
			Ext.each(settingsPane.items.items, function(c) { c.hide(); });
			
			settingsPane.down('#'+btn.getItemId()).show();
		}

    }

});
