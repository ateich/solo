//Each game has its own URL for user data
var usersRef = new Firebase('https://mvpfps.firebaseio.com');
var players = {};
var thisPlayer;
var username = 'Player2';
var deaths = 0;
var kills = 0;
var dead = false;

window.onkeyup = function(e) {
   var key = e.keyCode ? e.keyCode : e.which;

   if (key == 13) {
       if(document.getElementById('main').style.display !== 'none'){
       	startGame();
       }
   }
}


var startGame = function(){
	username = document.getElementById('playerName').value;
	if(players[username]){
		document.getElementById('playerName').value = '';
		alert(username + ' is already in the game. Choose another name.');
		return;
	}
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

  var numPlayers = Object.keys(players).length;

  if(numPlayers === 1){
 		document.getElementById('numPlayers').innerHTML = numPlayers +' Player is in the Game';
  } else {
  	document.getElementById('numPlayers').innerHTML = numPlayers +' Players are in the Game';
  }
});

usersRef.on('child_removed', function(snapshot){
	var playerName = snapshot.val().username;
	document.getElementById('gameMessage').innerHTML = '<h1>' + playerName + ' has left the game.</h1>';
	gameMessage.style.display = 'block';

	setTimeout(function(){
		document.getElementById('gameMessage').innerHTML = '';
		gameMessage.style.display = 'none';
	},3000);

	delete players[playerName];
	var numPlayers = Object.keys(players).length;
	 if(numPlayers === 1){
			document.getElementById('numPlayers').innerHTML = numPlayers +' Player is in the Game';
	 } else {
	 	document.getElementById('numPlayers').innerHTML = numPlayers +' Players are in the Game';
	 }
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
  	// console.log("FB SET MAP LOCATION: (", player.x, ", ", player.y, ") to ", 101);
  	if(player.health <= 0){
			//die
			//201 = death animation or color change
			map.set(player.x, player.y, 201);
			
			document.getElementById('gameMessage').innerHTML = '<h1>' + player.killedBy + ' killed ' + player.username + '.</h1>';
			gameMessage.style.display = 'block';

			setTimeout(function(){
				document.getElementById('gameMessage').innerHTML = '';
				gameMessage.style.display = 'none';
			},3000);
			
		}else{
			map.set(player.x, player.y, 101);
		}

		//Update player list
		players[player.username] = player;

	} 
	else if(player.health !== oldPlayer.health){

		//update player health as necessary
		console.log('Firebase says you have been hurt!');
		oldPlayer.health = player.health;
		document.getElementById('health').innerHTML = 'Health: ' + oldPlayer.health;
		redFlash();

		if(oldPlayer.health <= 0 && !dead){
			dead = true;
			//die leaving your body behind for x seconds
			console.log('Firebase says you died!');
			death.style.display = 'block';
			deaths++;
			document.getElementById('deaths').innerHTML = 'Deaths: ' + deaths;

			document.getElementById('youDied').innerHTML = 'Killed by ' + player.killedBy;
			var respawnTime = 3;
			document.getElementById('respawnCount').innerHTML = "Respawning in " + respawnTime;
			countdown(respawnTime, function(seconds){
				document.getElementById('respawnCount').innerHTML = "Respawning in " + seconds;
			});

			//Tell Player that they died
			// player = new Player(15.3, -1.2, Math.PI * 0.3);
			player.x = startX;
			player.y = startY;
			player.direction = Math.PI * 0.3;

			setTimeout(function(){
				dead = false;
				var reset = {username:username, x:0, y:0, health:100};
				updatePlayer(reset);
				players[username] = reset;
				death.style.display = 'none';
			}, 3000);
		}
	}
});

var countdown = function(seconds, doEachSecond){
	if(seconds === 0){
		return;
	}

	setInterval(function(){
		doEachSecond(seconds-1);
		countdown(seconds-1, doEachSecond);
	}, 1000);
}

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
var eachPlayer = function(callback, after){
	// console.log('each player, ', players);
	for(var key in players){
		callback(players[key]);
	}
	if(after){
		after();
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

var redFlash = function(){
	//set screen to red, then back to normal
	hitCell.style.display="block";
	setTimeout(function(){
		hitCell.style.display = "none";
	},250);
}
