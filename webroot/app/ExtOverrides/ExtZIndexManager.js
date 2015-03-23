// allow customizing window's modal mask
Ext.define('vcube.ExtOverrides.ExtZIndexManager',{
    override:'Ext.ZIndexManager',


    _showModalMask:function(comp){


        this.callParent(arguments);


        // mask is a reusable element, so each time it needs to accept only the relevant style
        this.mask.removeCls(this.customMaskCls);
        this.customMaskCls = 'modal-mask-'+comp.ui;
        this.mask.addCls(this.customMaskCls);


    }


});