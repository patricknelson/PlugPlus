//Tracking
(function(){
	var _gaq = _gaq || [];
	_gaq.push(['plugplus._setAccount', 'UA-32685589-1']);
	_gaq.push(['plugplus._trackPageview']);
})();//Hidden anonymous calls.


/**
 * This is the interface that is injected by PlugPlus to
 * run on the page. It has access to plug.dj javascript
 * and can listen to the plug.dj events. It will request
 * the settings from PlugPlus once.
 */
PlugPlusApp = function(){
	this.settings = JSON.parse(localStorage['PlugPlusSettings']);
	
	/* Events */
	this.setupEvents();
	
	//Trip auto functions on startup.
	this.autoWoot();
	this.autoJoin();
	
	var scope = this;
	
	setTimeout(function(){
		scope.setupPlugList();
	}, 10000);
	
	$('#plugPlusList #refresh').click(function(){
		scope.setupPlugList();
	});

	/* Init */
	if (FB)//If FB is not ready, it will take care of this anyways.
		FB.XFBML.parse();//Setup Plug Comments
};
PlugPlusApp.prototype = {

		constructor : PlugPlusApp,

		fireEvent : function(data){
			$('#plugIn').text(JSON.stringify(data));
			try{
				$('#plugIn').trigger(this.event);
			}catch(e){
				console.warn("PlugPlusAPP: The system could not fire the event! Some features may not work.", e);
			}
		},

		handlePlugPlusEvent : function(data){
			var data = data.data;
			if (data.from != "plugPlus") return;
			switch(data.type){
			case "settingsChange":
				this.settings = JSON.parse(localStorage['PlugPlusSettings']);
				this.autoWoot();
				this.autoJoin();
				break;
			default: console.warn("PlugPlusApp: Something may have gone wrong,",data);
			}
		},

		setupEvents : function(){
			var scope = this;
			//Plug Plus listeners
			try{
				window.addEventListener("message", function(data){scope.handlePlugPlusEvent(data)});
			}catch(e){
				console.warn("PlugPlusApp: An error occured setting up the event listener. Some features may not work!", e);
			}

			//Plug.dj listeners
			API.on(API.DJ_ADVANCE, function(obj){
				scope.autoWoot();
				scope.songUpdate(obj);
				scope.updateRoomStats();
			});
			API.on(API.DJ_UPDATE, function(){
				scope.autoJoin();
			});
			API.on(API.VOTE_UPDATE, function(obj){
				scope.userVote(obj);
				scope.updateRoomStats();
			});
			API.on(API.WAIT_LIST_UPDATE, function(){
				scope.updateRoomStats();
			});
			API.on(API.USER_JOIN, function(obj){
				scope.updateRoomStats();
			});
			API.on(API.USER_LEAVE, function(obj){
				scope.updateRoomStats();
			});

		},

		autoWoot : function(){
			if (this.settings.autoWoot){
				setTimeout(function(){
						$('#button-vote-positive').click();
				}, this.settings.autoWootDelay * 1000);
			}
		},

		autoJoin : function(){
			if (this.settings.autoJoin){
				if (API.getBoothPosition() == -1 && API.getWaitListPosition() == -1)
					API.djJoin();
			}
		},

		songUpdate : function(obj){
			
			$('#plugPlusListArea div').removeClass('woot meh');
			
		},

		djUpdate : function(obj){
			
		},

		userJoin : function(obj){
			
			var u = obj.user;
			var user = new ListUser(u.id, u.username, u.permission, you, u.relationship, u.vote);
			$('#plugPlusListArea').append(user.getDOM());
			
		},

		userLeave : function(obj){
			
			this.getUser(obj.user.id).remove();
			
		},
		
		userVote : function(obj){
			
			var vote = (obj.vote == 1) ? "woot" : "meh";
			
			$("#" + obj.user.id).removeClass('woot meh').addClass(vote);
			
		},
		
		updateRoomStats : function(){
			var userCount = API.getUsers().length;
			var waitListLength = API.getWaitList().length;
			var waitListPosition = API.getWaitListPosition();
			var roomVotes = API.getRoomScore();
			var percent = (.5 + ((roomVotes.positive/userCount) - (roomVotes.negative/userCount))*.5) * 100;
			
			$('#plugUsers').text(userCount);
			
			if (waitListPosition != -1){
				$('#plugWaitList').text(waitListPosition + "/" + waitListLength);
			} else {
				$('#plugWaitList').text(waitListLength);
			}
			
			$('#plugSongStats').text(percent.toPrecision(5) + "%");
			
			
		},
		
		setupPlugList : function(){
			
			var you = API.getUser().id;
			
			var listArea = $('#plugPlusListArea');
			var users = API.getUsers();
			
			listArea.text("");//Clear
			
			for (var i = 0; i<users.length; ++i){
				
				var u = users[i];
				var user = new ListUser(u.id, u.username, u.permission, you, u.relationship, u.vote);
				
				listArea.append(user.getDOM());
				
			}
			
		},
		
		getUser : function(id){
			
			return $('#' + id);
			
		}
};

ListUser = function(id, name, permission, you, relation, vote){
	this.id = id;
	this.name = name;
	this.isMod = (permission>1);
	this.isYou = (id == you);
	this.relation = relation;
	this.vote = vote;
};
ListUser.prototype.constructor = ListUser;
ListUser.prototype.getDOM = function(){
	
	var element = document.createElement('div');
	var je = $(element);
	
	je.attr('id', this.id);
	je.text(this.name);
	
	if (this.relation > 2){
		je.addClass('friend');
	} else if (this.relation > 0){
		je.addClass('fan');
	}
	
	if (this.isMod){
		je.addClass('mod');
	}
	
	if (this.isYou){
		je.addClass('you');
	}
	
	if (this.vote == 1){
		je.addClass('woot');
	} else if (this.vote == -1){
		je.addClass('meh');
	}
	
	return element;
	
};



//TODO Make anonymous.
var plugplus = new PlugPlusApp();
