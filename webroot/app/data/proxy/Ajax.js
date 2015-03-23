/**
 * app ajax proxy
 */
Ext.define('vcube.data.proxy.Ajax', {
    extend: 'Ext.data.proxy.Ajax',
    alias: 'proxy.vcubeAjax',
    config: {
    	listeners: {
    		exception: function(proxy, response, operation) {
    			
    			if(response.status != 200) {
	    			vcube.utils.alert({'error':"Operation `" + operation.request.proxy.url + "` failed (" + response.status + "): " + response.statusText,
	    				'details':response.responseText});
    			}
    		},
    	},
    	type: 'ajax',
    	noCache: false,
    	reader: {
    		type: 'vcube.data.reader.Json'
    	}    	
    }
});
