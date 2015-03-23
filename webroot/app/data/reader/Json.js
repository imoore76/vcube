Ext.define('vcube.data.reader.Json', {
    extend: 'Ext.data.reader.Json',
    alias: 'reader.vcubeJsonReader',

    getMetaData : function() {
    	return this.metaData;
    },
    
    getResponseData: function(response) {
        var data, error;
         
        try {

        	data = Ext.decode(response.responseText).data;
            

            // Handle errors and messages
        	vcube.utils.handleResponseMetaData(data);
            
            // Root will be responseData
            data = data.responseData;

            // Initial root. Used in treestores
            if(this.initialRoot) {
            	// Hold response data without the root
            	// this sometimes contains metadata
            	this.metaData = data;
            	data = data[this.initialRoot];
            	this.metaData[this.initialRoot] = null;
            }
            
            if(this.asChildren) {

            	if(!data || !data.id) {
            		data = [];
            	} else if(data.toString() != "[object Array]") {
            		data = new Array(data);
            	}
            
            	data = {'text':'.','children':data,'expanded':true};
            	
            	
            }
            
            return this.readRecords(data);

        } catch (ex) {
            error = new Ext.data.ResultSet({
                total  : 0,
                count  : 0,
                records: [],
                success: false,
                message: ex.message
            });

            this.fireEvent('exception', this, response, error);

            Ext.Logger.warn('Unable to parse the JSON returned by the server');

            return error;
        }
    }
});