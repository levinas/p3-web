define("p3/widget/ActionBar", [
	"dojo/_base/declare","dijit/_WidgetBase","dojo/on",
	"dojo/dom-class","./Button","dojo/dom-construct",
	"dijit/Tooltip"
], function(
	declare, WidgetBase, on,
	domClass,Button,domConstruct,
	Tooltip
){
	return declare([WidgetBase], {
		"baseClass": "ActionBar",
		constructor: function(){
			this._actions={}
		},
		selection: null,
		currentContainerType: null,
		currentContainerWidget: null,
		_setCurrentContainerWidgetAttr: function(widget){
			//console.log("_set Current Container Widget: ", widget);
			//console.log("Widget: ", widget.containerType, widget);
			
			if (widget === this.currentContainerWidget) { return; }
			this.currentContainerType=widget.containerType;
			this.currentContainerWidget = widget;
			this.set("selection", []);
		},
		_setSelectionAttr: function(sel){
			//console.log("setSelection", sel);
			this.selection = sel;

//			return;
			var valid;
			var selectionTypes = {}
			sel.forEach(function(s){
				var type = s.document_type || s.type;
				//console.log("Checking s: ", type, s);
				if (type=="job_result") {
					if (s.autoMeta && s.autoMeta.app) {
						if (typeof s.autoMeta.app=="string") {
							type = s.autoMeta.app
						}else if (s.autoMeta.app.id){
							type=s.autoMeta.app.id;
						}
					}
				}
				//console.log("Type: ", type);
				selectionTypes[type]=true;
			});
			//console.log("selectionTypes: ", selectionTypes);
	
			if (sel.length>1) {
				var multiTypedSelection = (Object.keys(selectionTypes).length>1)?true:false;
//				console.log("isMultiTyped: ", multiTypedSelection);	
				valid = Object.keys(this._actions).filter(function(an){
					//console.log("Check action: ", an, this._actions[an].options);
					return this._actions[an] && this._actions[an].options && (this._actions[an].options.multiple && ((this._actions[an].options.ignoreDataType || !multiTypedSelection || (multiTypedSelection && this._actions[an].options.allowMultiTypes)) )||this._actions[an].options.persistent)
				},this);	
			

				//console.log("multiselect valid: ", valid)
			}else if (sel.length==1){
				valid = Object.keys(this._actions)
			}else{
				valid=Object.keys(this._actions).filter(function(an){
					return this._actions[an] && this._actions[an].options && this._actions[an].options.persistent;
				},this);
			}

			var types = Object.keys(selectionTypes)
			//console.log("Filtering for Types: ", types);
			valid = valid.filter(function(an){
				var act = this._actions[an];
				var validTypes = act.options.validTypes||[];
				//console.log("validTypes for action : ",an, validTypes);
				var validContainerTypes = act.options.validContainerTypes || null;

				if (validContainerTypes){
					//console.log("checkValidContainerTypes", validContainerTypes);
					//console.log("Current ContainerType: ", this.currentContainerType);
					//console.log("Current Container Widget: ", this.currentContainerWidget);
					if (!validContainerTypes.some(function(t){
						return ((t=="*") || (t==this.currentContainerType))
					},this)){
						return false;
					};		
				}
	
				return validTypes.some(function(t){
					return ((t=="*") || (types.indexOf(t)>=0));
				});		
			},this);

			//console.log("ValidTypes: ", valid);
			Object.keys(this._actions).forEach(function(an){
				var act = this._actions[an];
				if (valid.indexOf(an)>=0){
					domClass.remove(act.button, "dijitHidden");
				}else{
					domClass.add(act.button,"dijitHidden");
				}
			},this);

		},

		postCreate: function(){
			this.inherited(arguments);
			var _self=this;
			this.containerNode=this.domNode;
			on(this.domNode, ".ActionButtonWrapper:click", function(evt){
				//console.log("evt.target: ", evt.target);
				var target;
				if (evt && evt.target && evt.target.attributes && evt.target.attributes.rel) {
					target = evt.target;
				}else{
					target = evt.target.parentNode;
				}
				//console.log("target: ", target);
				if (target && target.attributes && target.attributes.rel) {	
					var rel = target.attributes.rel.value;
					if (_self._actions[rel]) {
						_self._actions[rel].action.apply(_self,[_self.selection, _self.currentContainerWidget]);
					}
				}
			});	

//			on(this.domNode, ".ActionButton:mouseover", function(evt){
//				//console.log("mouseover evt: ", evt.target);
//			});	
			new Tooltip({
				connectId: this.domNode,
				selector: ".ActionButtonWrapper",
				getContent: function(matched){
					//console.log("Matched: ", matched);
					var rel = matched.attributes.rel.value;
					//console.log("REL: ", rel);
					if (_self._actions[rel] && _self._actions[rel].options && _self._actions[rel].options.tooltip){
						//console.log("_self._actions[rel]:", rel, _self._actions[rel]);
						return _self._actions[rel].options.tooltip
					}else if (matched.attributes.title && matched.attributes.title.value){
						return  matched.attributes.title.value;
					}
					return false;
				},
				position: ["above"]
			});
	
		},

		addAction: function(name,classes,opts,fn,enabled){
			var wrapper = domConstruct.create("div", {"class": "ActionButtonWrapper",rel:name});
			var b = domConstruct.create("div",{'className':(enabled?"":"dijitHidden ")+"ActionButton " +classes},wrapper);

			if (opts && opts.label) {
				var t = domConstruct.create("div",{innerHTML: opts.label, "class":"ActionButtonText"},wrapper);
			}		

			domConstruct.place(wrapper,this.containerNode,"last");

			this._actions[name]={
				options: opts,
				action: fn,
				button: wrapper 
			};
				
		}
		
	});
});
