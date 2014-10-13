//Each game has its own URL for user data


var usersRef = new Firebase('https://mvpfps.firebaseio.com');
var players = {};
var thisPlayer;
var username = 'Player2';

var startGame = function(){
	username = document.getElementById('playerName').value;
	thisPlayer = usersRef.child(username); //Firebase object
	thisPlayer.update({username:username, health:'100', x:'0', y:'0'});

	document.getElementById('main').style.visibility = 'hidden';
	gameCell.style.visibility = "visible";
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
	// console.log(player.username, ' : ', username);
	if(player.username != username){
		//Remove player on screen
  	// console.log("FB SET MAP LOCATION: (", oldPlayer.x, ", ", oldPlayer.y, ") to ", 0);
		map.set(oldPlayer.x, oldPlayer.y, 0);
		
		//Move player to new location on screen (101 now, change later)
  	console.log("FB SET MAP LOCATION: (", player.x, ", ", player.y, ") to ", 101);
		map.set(player.x, player.y, 101);

		//Update player list
		players[player.username] = player;
	}
});

//Update this player in firebase
var updatePlayer = function(obj){
	thisPlayer.update(obj);
};

var updatePlayerPosition = function(x,y){
	updatePlayer({x: x, y:y});
};

//Passes player object to callback, for each player
var eachPlayer = function(callback){
	for(var key in players){
		callback(players[key]);
	}
};	
