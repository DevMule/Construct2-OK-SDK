﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

///////////////////////////////////////////////////////////////////////////
// Plugin class
cr.plugins_.OKAPI = function(runtime)
{
	this.runtime = runtime;
};

// API_callback declaration
var API_callback = null;

(function ()
{
	var pluginProto = cr.plugins_.OKAPI.prototype;

	///////////////////////////////////////////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	var OKRuntime = null;
	var OKinstance = null;
	var UserID = null;
	var UserFirstName = null;
	var UserLastName = null;
	var UserAvatar = null;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	///////////////////////////////////////////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
	};
	
	var instanceProto = pluginProto.Instance.prototype;
	instanceProto.onCreate = function()
	{
		OKRuntime = this.runtime;
		OKinstance = this;

		API_callback = function(method, result, data){
			/*
			* method	-	название вызванного метода;
			* result	-	результат выполнения (“ok” в случае успеха, “cancel” в случае, если пользователь отменил действие);
			* data		-	дополнительная информация, например, для showInvite() – это список id приглашенных друзей, разделенный запятыми, в формате строки.
			*
			* Эта функция вызывается после завершения выполнения следующих методов:
			* showPermissions, showInvite, showNotification, showPayment, showConfirmation, setWindowSize
			*/
			if (method == "showPayment"){
				if (result == "ok"){
					OKRuntime.trigger(cr.plugins_.OKAPI.prototype.cnds.OnTransactionDone, OKinstance);
				} else {
					OKRuntime.trigger(cr.plugins_.OKAPI.prototype.cnds.OnTransactionfail, OKinstance);
				}
			} else if (method == "showInvite"){
				if (result == "ok"){
					//OKRuntime.trigger(cr.plugins_.OKAPI.prototype.cnds.OnTransactionDone, OKinstance);
				} else {
					//OKRuntime.trigger(cr.plugins_.OKAPI.prototype.cnds.OnTransactionfail, OKinstance);
				}
			}
		}


		function loadScript( url, callback ) {
			var script = document.createElement( "script" )
			script.type = "text/javascript";
			if(script.readyState) {  // only required for IE <9
				script.onreadystatechange = function() {
					if ( script.readyState === "loaded" || script.readyState === "complete" ) 
						{script.onreadystatechange = null;callback();}};
			} else { script.onload = function() {callback();};}
			script.src = url;
			document.getElementsByTagName( "head" )[0].appendChild( script );
		}
		loadScript("//api.ok.ru/js/fapi5.js", function() {
			console.log("fapi successfully loded");
		});

	}

	////////////////////////////////////////////////////////////////////////////
	// Conditions
	function Cnds() {};
	
	Cnds.prototype.OnInitDone = function (){
		return true;
	};
	
	Cnds.prototype.OnInitFail = function (){
		return true;
	};
	
	Cnds.prototype.OnUserdataLoaded = function (){
		return true;
	};
	
	Cnds.prototype.OnTransactionDone = function (){
		return true;
	};
	
	Cnds.prototype.OnTransactionfail = function (){
		return true;
	};
	
	pluginProto.cnds = new Cnds();

	////////////////////////////////////////////////////////////////////////////
	// Expressions
	function Exps() {};
	
	Exps.prototype.GetIsInit = function (ret){
		var data = FAPI.initialized;
		ret.set_string(data.toString());
	};
	
	Exps.prototype.GetUserFirstName = function (ret){
		ret.set_string(UserFirstName);
	};
	
	Exps.prototype.GetUserLastName = function (ret){
		ret.set_string(UserLastName);
	};
	
	Exps.prototype.GetUserID = function (ret){
		ret.set_string(UserID);
	};
	
	Exps.prototype.GetUserAvatar = function (ret){
		ret.set_string(UserAvatar);
	};
	
	pluginProto.exps = new Exps();

	////////////////////////////////////////////////////////////////////////////
	// Actions
	function Acts() {};

	Acts.prototype.ShowPayment = function (name_, description_, code_, price_, attributes_){
		FAPI.UI.showPayment(name_, description_, code_, price_, attributes_, null, "ok", "true");
	};

	Acts.prototype.ShowInvite = function (text_, params_){
		FAPI.UI.showInvite(text_, params_);
	};

	Acts.prototype.InitUser = function (){

		var callback_getCurrentUser = function(method,result,data){
			if (result){
				UserID = result['uid'];
				UserAvatar = result['pic128x128'];
				UserFirstName = result['first_name'];
				UserLastName = result['last_name'];
				
				OKRuntime.trigger(cr.plugins_.OKAPI.prototype.cnds.OnUserdataLoaded, OKinstance);
			}
		}

		var rParams = FAPI.Util.getRequestParameters();
		FAPI.init(rParams["api_server"], rParams["apiconnection"],
		
			// on success
			function() {
				console.log("OK_API: initialization successfully done!");
				OKRuntime.trigger(cr.plugins_.OKAPI.prototype.cnds.OnInitDone, OKinstance);

				// ASK FOR USER DATA
				FAPI.Client.call({"fields":"first_name,last_name,pic128x128","method":"users.getCurrentUser"}, callback_getCurrentUser);
			},
		
			// on fail
			function(error) {
				console.log("OK_API: initialization error!");
				console.log(error);
				OKRuntime.trigger(cr.plugins_.OKAPI.prototype.cnds.OnInitFail, OKinstance);
			}
		);
	};
	
	pluginProto.acts = new Acts();


}());