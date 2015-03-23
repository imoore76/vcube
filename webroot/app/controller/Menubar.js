/*
 * NavTree Controller
 */
Ext.define('vcube.controller.Menubar', {
    extend: 'Ext.app.Controller',
    
    // Hold nav tree ref so that we only have to get this once
    refs : [{
    	selector: 'viewport > Menubar',
    	ref: 'Menubar'
    },{
    	selector: 'viewport > Menubar #logout',
    	ref: 'LogoutItem'
    }],
    
    /* Watch for events */
    init: function(){
    	
    	/* Application level events */
        this.application.on({
            start: this.updateLogout, 
            scope: this
        });
        
        /* Tree events */
        this.control({
        	'viewport > Menubar > toolbar' : {
        		render: function(tbar) {
        			tbar.add([
        				{xtype:'tbfill'},
        				'vCube ' + vcube.app.version + ' @ ' + location.hostname + ' <img src="images/vcube.png" style="width:12px;height:12px;margin-right: 4px; margin-left: 4px; display:inline-block;" />'
        			])
        		}
        	},
        	'viewport > Menubar menuitem' : {
        		click: this.itemClicked
        	}
        });
    },
    
    /* Menu item is clicked */
    itemClicked: function(item) {
    	
    	switch(item.itemId) {
    	
    		case 'logout':
    			this.application.stop();
    			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('app/Logout')).done(function(){
    				location.reload(true);
    			});
    			break;
    	}
    },
    
 
    /* Populate navigation tree with groups and VMs */
    updateLogout: function() {
    	this.getLogoutItem().setText('Logout - ' + (this.application.session.user.name ? this.application.session.user.name : this.application.session.user.userid));
    }
    	
});