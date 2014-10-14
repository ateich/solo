//Each game has its own URL for user data

var usersRef = new Firebase('https://mvpfps.firebaseio.com');
var players = {};
var thisPlayer;
var username = 'Player2';
var deaths = 0;
var kills = 0;


var startGame = function(){
	username = document.getElementById('playerName').value;
	thisPlayer = usersRef.child(username); //Firebase object
	thisPlayer.update({username:username, health:'100', x:'0', y:'0'});

	document.getElementById('main').style.display = 'none';
	gameCell.style.display = "block";
};

//Separate users from players in a game

//Create new player in firebase
//	uses update instead of set in case we add high score or other features
//	that should not be overridden each time a player joins a game

//Add new player to players list
usersRef.on('child_added', function(snapshot) {
	var newPlayer = snapshot.val();
	console.log('Added player: ', newPlayer.username);
  players[newPlayer.username] = newPlayer;
});

//Update players that have been changed
usersRef.on('child_changed', function(snapshot){
	var player = snapshot.val();
	var oldPlayer = players[player.username];

	//Don't update your own screen position via Firebase
	if(player.username != username){
		//Remove player on screen
  	// console.log("FB SET MAP LOCATION: (", oldPlayer.x, ", ", oldPlayer.y, ") to ", 0);
		map.set(oldPlayer.x, oldPlayer.y, 0);
		
		//Move player to new location on screen (101 now, change later)
  	console.log("FB SET MAP LOCATION: (", player.x, ", ", player.y, ") to ", 101);
  	if(player.health <= 0){
			//die
			//201 = death animation or color change
			map.set(player.x, player.y, 201);
		}else{
			map.set(player.x, player.y, 101);
		}

		//Update player list
		players[player.username] = player;

	} else if(player.health !== oldPlayer.health){

		//update player health as necessary
		oldPlayer.health = player.health;
		if(oldPlayer.health <= 0){
			//die leaving your body behind for x seconds
			deaths++;
			document.getElementById('deaths').innerHTML = 'Deaths: ' + deaths;
			setTimeout(function(){
				var reset = {username:username, x:0, y:0, health:100};
				updatePlayer(reset);
				players[username] = reset;
			}, 1000);
		}
	}
});

//Update this player in firebase
var updatePlayer = function(obj){
	thisPlayer.update(obj);
};

var updatePlayerPosition = function(x,y){
	updatePlayer({x: x, y:y});
};

var updatePlayerHealth = function(healthAddition){
	var health = parseInt(players[username].health) + healthAddition + '';
	updatePlayer({health: health});
	document.getElementById('health').innerHTML = 'Health: ' + health;
}

//Passes player object to callback, for each player
var eachPlayer = function(callback){
	console.log('each player, ', players);
	for(var key in players){
		callback(players[key]);
	}
};	

var getPlayer = function(name){
	return usersRef.child(name);
}

var setPlayer = function(player, obj){
	player.update(obj);
}

//If the user closes the window, they leave the game
window.onbeforeunload = function(e) {
  thisPlayer.remove();
};
