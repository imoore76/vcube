/*
 * Form that allows multi-dimensional setting / getting
 * via prop.prop.prop..etc ..
 */
Ext.define('vcube.form.Basic', {
    extend: 'Ext.form.Basic',
    
    alias: 'widget.vcube.form.Basic',
    
    setValues: function(values) {
    	
        var me = this;

        Ext.suspendLayouts();
        
        function setVal(fieldId, val) {

        	// Special case for multi-dimensional fields
        	if(val && Ext.isObject(val)) {
        		
        		Ext.iterate(val, function(fid, v) {
        			setVal(fieldId + '.' + fid, v);
        		});
        		return;
        	}
            var field = me.findField(fieldId);
            if (field) {
                field.setValue(val);
                if (me.trackResetOnLoad) {
                    field.resetOriginalValue();
                }
            }
        }

        
        if (Ext.isArray(values)) {
            // array of objects
            Ext.each(values, function(val) {
                setVal(val.id, val.value);
            });
        } else {
            // object hash
            Ext.iterate(values, setVal);
        }
        
        Ext.resumeLayouts(true);
        
        return this;
    }

});
