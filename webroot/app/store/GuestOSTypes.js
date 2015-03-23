Ext.define('vcube.store.GuestOSTypes',{
	extend: 'Ext.data.Store',
	autoload: false,
	remoteSort: true,
	proxy: {
		type: 'vcubeAjax',
		url: 'vbox/vboxGetGuestOSTypes',
		noCache: false,
    	reader: {
    		type: 'vcubeJsonReader'
    	}
	},
	fields : [
		{name: 'description'},
		{name: 'supported', type: 'boolean'},
		{name: 'recommendedHDD', type: 'int'},
		{name: 'id', type: 'string'},
		{name: 'is64Bit'},
		{name: 'familyId'},
		{name: 'recommendedRAM', type: 'int'},
		{name: 'familyDescription'}
	]	
});
