var gameCell = document.getElementById('game');
var deathCell = document.getElementById('death');
var hitCell = document.getElementById('hit');
var gameMessage = document.getElementById('gameMessage');

gameCell.style.display = 'none';
deathCell.style.display = 'none';
hitCell.style.display = 'none';
// gameMessage.style.display = 'none';

var hitDelay = false;
var shotDelay = false;
var firingWeapon = false;

var CIRCLE = Math.PI * 2;
var MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)

function Controls() {
  this.codes  = { 37: 'left', 39: 'right', 38: 'forward', 40: 'backward', 32:'fire' };
  this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false, 'fire':false};
  document.addEventListener('keydown', this.onKey.bind(this, true), false);
  document.addEventListener('keyup', this.onKey.bind(this, false), false);
  document.addEventListener('touchstart', this.onTouch.bind(this), false);
  document.addEventListener('touchmove', this.onTouch.bind(this), false);
  document.addEventListener('touchend', this.onTouchEnd.bind(this), false);
}

Controls.prototype.onTouch = function(e) {
  var t = e.touches[0];
  this.onTouchEnd(e);
  if (t.pageY < window.innerHeight * 0.5) this.onKey(true, { keyCode: 38 });
  else if (t.pageX < window.innerWidth * 0.5) this.onKey(true, { keyCode: 37 });
  else if (t.pageY > window.innerWidth * 0.5) this.onKey(true, { keyCode: 39 });
};

Controls.prototype.onTouchEnd = function(e) {
  this.states = { 
    'left': false, 'right': false, 'forward': false, 'backward': false,
    'fire': false
  };
  e.preventDefault();
  e.stopPropagation();
};

Controls.prototype.onKey = function(val, e) {
  var state = this.codes[e.keyCode];
  if (typeof state === 'undefined') return;
  this.states[state] = val;
  e.preventDefault && e.preventDefault();
  e.stopPropagation && e.stopPropagation();
};

function Bitmap(src, width, height) {
  this.image = new Image();
  this.image.src = src;
  this.width = width;
  this.height = height;
}

function Player(x, y, direction) {
  this.x = x;
  this.y = y;
  this.direction = direction;
  // this.weapon = new Bitmap('assets/knife_hand.png', 319, 320);
  this.weapon = new Bitmap('assets/gunHand1.png', 319, 320);
  this.fireWeapon = new Bitmap('assets/gunHand2.png', 319, 320);
  this.paces = 0;
}

Player.prototype.rotate = function(angle) {
  this.direction = (this.direction + angle + CIRCLE) % (CIRCLE);
};

Player.prototype.walk = function(distance, map) {
  var dx = Math.cos(this.direction) * distance;
  var dy = Math.sin(this.direction) * distance;


  //Have additional players as 101, 102, ..., 10n
  // where Player1 = 101, Player2 = 102, ..., PlayerN = 10n

  //If the map doesn't have anything at this location, walk to it
  var changedPosition = false;
  var hitPlayer = {};

  if (map.get(this.x + dx, this.y) <= 0){
    this.x += dx;
    changedPosition = true;
  } else {
    //X collision
    if(map.get(this.x + dx, this.y) >= 100){
      //hit player
      hitPlayer.x = this.x+dx;
    }
  }
  if (map.get(this.x, this.y + dy) <= 0){
    this.y += dy;
    changedPosition = true;
  } else {
    //Y collision
    if(map.get(this.x, this.y + dy) >= 100){
      //hit player
      hitPlayer.y = this.y+dy;
    }
  }

  if(!hitDelay && (hitPlayer.x || hitPlayer.y)){
    //this player loses health
    console.log('losing health');
    var healthAddition = -10;

    //other player loses health -- in theory...
    hitPlayer.x = hitPlayer.x || this.x;
    hitPlayer.y = hitPlayer.y || this.y;
    var playerLocation = {x: Math.floor(hitPlayer.x), y:Math.floor(hitPlayer.y)};

    //You can only hit someone once every second
    hitDelay = true;
    setTimeout(function(){
      console.log('reset hit delay');
      hitDelay = false;
    }, 1000);

    eachPlayer(function(player){
      if(player.username === username){return;}
      console.log('name: ', player.username, ' at (', player.x, ', ', player.y ,')');
      console.log('vs at (', playerLocation.x, ',', playerLocation.y,  ')')
      
      if(Math.floor(player.x) === playerLocation.x || Math.floor(player.y) === playerLocation.y){
        console.log('hit ', player.username);


        var hitPlayer = getPlayer(player.username);
        var health = parseInt(player.health) + healthAddition + '';
        setPlayer(hitPlayer, {health: health});
        console.log('shot player');
        if(health === 0 && map.get(player.x, player.y) < 200){
          console.log('kill confirmed');
          kills++;
          document.getElementById('kills').innerHTML = 'Kills: ' + kills;
        }
        return;
      }
    }, function(){ updatePlayerHealth(healthAddition);});

  }

  if(changedPosition){
    updatePlayerPosition(this.x, this.y);
  }  
  this.paces += distance;
};

Player.prototype.update = function(controls, map, seconds) {
  if (controls.left) this.rotate(-Math.PI * seconds);
  if (controls.right) this.rotate(Math.PI * seconds);
  if (controls.forward) this.walk(3 * seconds, map);
  if (controls.backward) this.walk(-3 * seconds, map);
  if (controls.fire) this.fire();
};

Player.prototype.fire = function(){
  //check if a person is in the line of fire
  console.log('fire!');

  if(shotDelay){
    return;
  }

  firingWeapon = true;

  setTimeout(function(){
    firingWeapon = false;
  }, 100);

  // var x = column / camera.resolution - 0.5;
  // var angle = Math.atan2(x, camera.focalLength);
  var ray = map.cast(this, this.direction, camera.range);
  var hit = -1;
  var width = Math.ceil(camera.spacing);
  while (++hit < ray.length && ray[hit].height <= 0);

  //loop through all rays in ray
  for (var s = ray.length - 1; s >= 0; s--) {
    var step = ray[s];

    if(step.height >= 100){
      // console.log('Shots fired!', step);
      //hit a player, reduce their health
      eachPlayer(function(hitPlayer){
        // console.log('this player: ', hitPlayer);
        //if the bullet lands within the players width and height
        console.log(step)
        console.log(hitPlayer)
        if((step.x >= Math.floor(hitPlayer.x) && step.x < Math.floor(hitPlayer.x) + width) ||
          step.x >= Math.ceil(hitPlayer.x) && step.x < Math.ceil(hitPlayer.x) + width){
        // if(Math.floor(hitPlayer.x) === Math.floor(step.x) && Math.floor(hitPlayer.y) === Math.floor(step.y)){
          shotDelay = true;

          //show that the player was hit
          // map.set(hitPlayer.x, hitPlayer.y, 190);
          // map.set(step.x, step.y, 190);

          setTimeout(function(){
            shotDelay = false;
          }, 100);

          // setTimeout(function(){
          //   var unhitPlayer = players[this.username];
          //   map.set(this.x, this.y, 101);
          //   if(unhitPlayer){
          //     console.log('make not red damnit!');
          //     map.set(unhitPlayer.x, unhitPlayer.y, 101);
          //   }
          // }.bind(hitPlayer), 5000);


          var fbPlayer = getPlayer(hitPlayer.username);
          // console.log('hit confirmed, ', hitPlayer);
          var healthAddition = -10;

          // console.log('hitPlayer health: ', hitPlayer.health);
          var health = parseInt(hitPlayer.health) + healthAddition + '';
          // console.log('health: ', health);

          var status = parseInt(map.get(hitPlayer.x, hitPlayer.y));
          console.log('test: ', status, " health: ", health);
          if(health <= 0 &&  status < 200){
            console.log('kill confirmed');
            kills++;
            document.getElementById('kills').innerHTML = 'Kills: ' + kills;
          }
          setPlayer(fbPlayer, {health:health, killedBy:username});
        }
      });
    }
  }
};



function Map(size) {
  this.size = size;
  this.wallGrid = new Uint8Array(size * size);
  this.skybox = new Bitmap('assets/deathvalley_panorama4.jpg', 2000, 750);
  this.wallTexture = new Bitmap('assets/wall_texture.jpg', 1024, 1024);
  // this.wallTexture = new Bitmap('assets/fuzzy.png', 1024, 1112);
  // this.playerTexture = new Bitmap('assets/player_texture.jpg', 1024, 1024);
  // this.playerTexture = new Bitmap('assets/fuzzy.png', 1024, 1112);
  this.playerTexture = new Bitmap('assets/robot.png', 639, 1176);
  // this.deathTexture = new Bitmap('assets/death_texture.jpg', 1024, 1024);
  this.deathTexture = new Bitmap('assets/robot_dead.png', 639, 1176);
  this.hitPlayerTexture = new Bitmap('assets/hit_player_texture.jpg', 1024, 1024);
  this.light = 0;
}

Map.prototype.get = function(x, y) {
  x = Math.floor(x);
  y = Math.floor(y);

  //Cannot walk beyond borders of level
  //If you try to, return a wall
  if (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1) return -1;
  return this.wallGrid[y * this.size + x];
};

//map.set
Map.prototype.set = function(x, y, num){
  // console.log("SET MAP LOCATION: (", x, ", ", y, ") to ", num);
  // console.log("Wall grid: ", this.wallGrid);
  x = Math.floor(x);
  y = Math.floor(y);

  this.wallGrid[y*this.size + x] = num;
  // console.log('Does ', this.wallGrid[y*this.size+x], '===', num);
}

Map.prototype.randomize = function() {
  //Randomly generate walls (~ <1/3 of spaces are walls)
  for (var i = 0; i < this.size * this.size; i++) {
    this.wallGrid[i] = Math.random() < 0.3 ? 1 : 0;
  }
};

Map.prototype.setGridLayout = function(matrix){
  console.log('grid size: ', this.size);
  var field = new Uint8Array(this.size*this.size);
  //Loop through array of arrays (ROWS)
  var count = 0;
  for(var i=0; i<matrix.length; i++){
    //loop through COLUMNS
    for(var j=0; j<matrix[i].length; j++){
      field[count] = matrix[i][j];
      count++;
    }
  }
  this.wallGrid = field;
}

//returns an array of rays where result[n].height === game field row
Map.prototype.cast = function(point, angle, range) {
  var self = this;
  var sin = Math.sin(angle);
  var cos = Math.cos(angle);
  var noWall = { length2: Infinity };

  return ray({ x: point.x, y: point.y, height: 0, distance: 0 });

  //returns an array of rays where result[n].height === game field row
  function ray(origin) {
    var stepX = step(sin, cos, origin.x, origin.y);
    var stepY = step(cos, sin, origin.y, origin.x, true);

    //nextStep.height = game field row
    var nextStep = stepX.length2 < stepY.length2
      ? inspect(stepX, 1, 0, origin.distance, stepX.y)
      : inspect(stepY, 0, 1, origin.distance, stepY.x);

    if (nextStep.distance > range) return [origin];
    return [origin].concat(ray(nextStep));
  }

  function step(rise, run, x, y, inverted) {
    if (run === 0) return noWall;
    var dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
    var dy = dx * (rise / run);
    return {
      x: inverted ? y + dy : x + dx,
      y: inverted ? x + dx : y + dy,
      length2: dx * dx + dy * dy
    };
  }

  function inspect(step, shiftX, shiftY, distance, offset) {
    var dx = cos < 0 ? shiftX : 0;
    var dy = sin < 0 ? shiftY : 0;

    //get a row from the game field
    step.height = self.get(step.x - dx, step.y - dy);
    step.distance = distance + Math.sqrt(step.length2);

    if (shiftX) step.shading = cos < 0 ? 2 : 0;
    else step.shading = sin < 0 ? 2 : 1;
    step.offset = offset - Math.floor(offset);
    return step;
  }
};

Map.prototype.update = function(seconds) {
  if (this.light > 0) this.light = Math.max(this.light - 10 * seconds, 0);
  else if (Math.random() * 5 < seconds) this.light = 2;
};

function Camera(canvas, resolution, focalLength) {
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width = window.innerWidth * 0.5;
  this.height = canvas.height = window.innerHeight * 0.5;
  this.resolution = resolution;
  this.spacing = this.width / resolution;
  this.focalLength = focalLength || 0.8;
  this.range = MOBILE ? 8 : 14;
  this.lightRange = 5;
  this.scale = (this.width + this.height) / 1200;
}

Camera.prototype.render = function(player, map) {
  this.drawSky(player.direction, map.skybox, map.light);
  this.drawColumns(player, map);
  if(firingWeapon){
    this.drawWeapon(player.fireWeapon, player.paces);
  } else{
    this.drawWeapon(player.weapon, player.paces);
  }
};

Camera.prototype.drawSky = function(direction, sky, ambient) {
  var width = sky.width * (this.height / sky.height) * 2;
  var left = (direction / CIRCLE) * -width;

  this.ctx.save();
  this.ctx.drawImage(sky.image, left, 0, width, this.height);
  if (left < width - this.width) {
    this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
  }
  if (ambient > 0) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.globalAlpha = ambient * 0.1;
    this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
  }
  this.ctx.restore();
};

Camera.prototype.drawColumns = function(player, map) {
  this.ctx.save();
  for (var column = 0; column < this.resolution; column++) {
    var x = column / this.resolution - 0.5;
    var angle = Math.atan2(x, this.focalLength);
    // if(true){ // CHANGE THIS!!!
    //   angle = 90;
    // }

    //ray = an array of rays where ray[n].height === game field row
    var ray = map.cast(player, player.direction + angle, this.range);
    this.drawColumn(column, ray, angle, map);
  }
  this.ctx.restore();
};

Camera.prototype.drawWeapon = function(weapon, paces) {
  var bobX = Math.cos(paces * 2) * this.scale * 6;
  var bobY = Math.sin(paces * 4) * this.scale * 6;
  var left = this.width * 0.66 + bobX;
  var top = this.height * 0.6 + bobY;
  this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale);
};

var check = true;
Camera.prototype.drawColumn = function(column, ray, angle, map) {
  var ctx = this.ctx;
  if(check){
    check = false;
    console.log('Ray: ', ray);
  }
  var texture = map.wallTexture;
  var left = Math.floor(column * this.spacing);
  var width = Math.ceil(this.spacing);
  var hit = -1;

  while (++hit < ray.length && ray[hit].height <= 0);

  //loop through all rays in ray
  for (var s = ray.length - 1; s >= 0; s--) {
    var step = ray[s];

    if(step.height >= 200){
      texture = map.deathTexture;
      //Makes sprite tall and thin
      // angle = 90;//player.direction-90;
      step.height=0.7;
    }else if(step.height === 190){
      console.log('make red damnit!');
      //player hit
      texture = map.hitPlayerTexture;
      step.height=0.7;
    }else if(step.height >= 100){
      texture = map.playerTexture;
      // angle = 90;//player.direction-90;
      step.height=0.7;
      // width *= .5;
    }

    var rainDrops = Math.pow(Math.random(), 3) * s;
    var rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);

    if (s === hit) {
      //we hit something
      var textureX = Math.floor(texture.width * step.offset);
      var wall = this.project(step.height, angle, step.distance);

      ctx.globalAlpha = 1;
      // ctx.drawImage(texture.image, textureX, 0, 0.5, texture.height, left, wall.top, width, wall.height);
      ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height);
      
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
      ctx.fillRect(left, wall.top, width, wall.height);
    }
    
    ctx.fillStyle = '#02a400';//#0a7406';//'#ffffff';
    ctx.globalAlpha = 0.15;
    while (--rainDrops > 0) ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
  }
};

Camera.prototype.project = function(height, angle, distance) {
  var z = distance * Math.cos(angle);
  var wallHeight = this.height * height / z;
  var bottom = this.height / 2 * (1 + 1 / z);
  return {
    top: bottom - wallHeight,
    height: wallHeight
  }; 
};

function GameLoop() {
  this.frame = this.frame.bind(this);
  this.lastTime = 0;
  this.callback = function() {};
}

GameLoop.prototype.start = function(callback) {
  this.callback = callback;
  requestAnimationFrame(this.frame);
};

GameLoop.prototype.frame = function(time) {
  var seconds = (time - this.lastTime) / 1000;
  this.lastTime = time;
  if (seconds < 0.2) this.callback(seconds);
  requestAnimationFrame(this.frame);
};



var display = document.getElementById('display');
var startX = 5;//15.3
var startY = 5;//-1.2
var player = new Player(startX, startY, Math.PI * 0.3);
var map = new Map(16);
var controls = new Controls();
var camera = new Camera(display, MOBILE ? 160 : 320, 0.8);
var loop = new GameLoop();

// map.randomize();
var matrix = 
[
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
  [1,0,1,0,0,1,0,0,0,1,0,0,1,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,1,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,1,1,0,1,1,1,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,1,0,1,1,0,1,1,1,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
map.setGridLayout(matrix);

function Sprite(height, distance){
  var z = distance;
  var wallHeight = this.height*height/z;
  var bottom = this.height/2*(2/z);
  return {
    top:bottom-wallHeight,
    height:wallHeight
  };

}

var spriteBuffer = new Uint8Array(map.size*map.size);
var zBuffer = new Uint8Array (map.size);
var spriteOrder = [];
var spriteDistance = [];

loop.start(function frame(seconds) {
  map.update(seconds);
  player.update(controls.states, map, seconds);
  camera.render(player, map);
});