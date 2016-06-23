'use strict'

/// Still need to add the 16/16 part of MDN guide in here. RANDOMIZING gameplay

var game = new Phaser.Game(700, 500, Phaser.AUTO);

// game sprites:
var ball;
var paddle;
// bricks:
var bricks;
var newBrick;
var brickInfo
// score:
var scoreText;
var score = 0;
// lives:
var lives = 3;
var livesText;
var lifeLostText;
// Text Style:
var textStyle = { font: '18px Arial', fill: '#0095DD'};
// start button
var playing = false;
var startButton;


// game state
var GameState = {
    preload: function(){
        // scaleMode can contain .NO_SCALE / EXACT_FIT / SHOW_ALL / RESIZE / USER_SCALE
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // responsible for aligning the canvas element horizontal / vertical
        // so it is always centered regardless of size.
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        // set the stage object background color to my choice
        game.stage.backgroundColor = '#eee';
        // load the ball image, paddle image, brick image.
        game.load.image('ball', 'assets/ball.png');
        game.load.image('paddle', 'assets/paddle.png');
        game.load.image('brick', 'assets/brick.png');
        // load animations: --> using spritesheet() method.
        game.load.spritesheet('ball', 'assets/wobble.png', 20, 20);
        // load START button spritesheet animation.
        game.load.spritesheet('button', 'assets/button1.png', 120, 40);
    },
    create: function(){
        // initializing game physics:
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // BALL 
        // load animations to ball
        // we use the animations.add() method.
        // parameters: 1.name 2.array - defining order to display frames during animation. 3. fps(24), 9 frames --> almost 3 times per second.
        ball = game.add.sprite(50, 300, 'ball');
        ball.anchor.set(0.5);
        ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24);  
              
        // Enable phsyics to Ball.
        game.physics.enable(ball, Phaser.Physics.ARCADE);
        
        // this was commented --> now we have startGame() function to do this.
        // Add veolcity to Ball. --> move it right / bottom diagonally
        // ball.body.velocity.set(150, -150);
        
        // fun with phsyiscs:
        // ball.body.gravity.y = 100;
        
        // BOUNDS collision detection:
        // declare BOUNDS of game.
        ball.body.collideWorldBounds = true;
        // make ball bounce upon hitting BOUNDS
        ball.body.bounce.set(1);
        
        // define LOSS & Restart game.
        // enable crossing the bottom border to be considered - out of bounds
        game.physics.arcade.checkCollision.down = false;
        ball.checkWorldBounds = true;
        // ball hitting lower bounds(-1 life)
        ball.events.onOutOfBounds.add(ballLeaveScreen, this);
                
        // PADDLE
        // display the paddle (x - middle screen) (y - )
        paddle = game.add.sprite(game.world.width*0.5, game.world.height-0.5, 'paddle');
        // set anchor.
        paddle.anchor.set(0.5,1);
        // Enable physics to paddle.
        game.physics.enable(paddle, Phaser.Physics.ARCADE);
        // upon collide make paddle immovable - stay on screen.
        paddle.body.immovable = true;
        
        // create bricks 
        initBricks();
        
        // SCORE
        // text Method() takes 4 elems: 1. x and y to draw the text at 2. actual text to be rendered. 3. font style to render text
        scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
        
        // LIVES
        // positoon at the world x length -5 and y 5 height, anchor to the right(1), top(0)
        livesText = game.add.text(game.world.width-5, 5, 'Lives: ' + lives, textStyle);
        livesText.anchor.set(1, 0);
        
        // LIFE LOST
        // position at the world middel of screen
        lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, 'Life lost, click to continue', textStyle);
        // anchored in the middle of screen middle(0.5);
        lifeLostText.anchor.set(0.5);
        // will show only when life is lost.
        lifeLostText.visible = false;
        
        // add START button:
        // button parameters: 1-2. x & y coordinates. 3. name 4. callback func to be executed on press. 5. this reference -> to execute context. 
        // 6. frames to be used -> over, out, down events.(1.over-Hover, 2.out-pointer out of button, 3.down-button pressed.)
        startButton = game.add.button(game.world.length*0.5, game.world.length*0.5, 'button', startGame, this, 1, 0, 2);
        startButton.anchor.set(-2.8, -5);
    },
    update: function(){
        // check COLLISIONS: 
        // update when ball collides with paddle.
        game.physics.arcade.collide(ball, paddle, ballHitPaddle);
        game.physics.arcade.collide(ball, bricks, ballHitBrick);
        // PADDLE CONTROL
        // either the next location / default location.
        if (playing) {
            paddle.x = game.input.x || game.world.width*0.5;
        }
        
        
    }
};


game.state.add('GameState', GameState);
game.state.start('GameState');


// render the brick spread on the screen.
function initBricks() {
    brickInfo = {
        width: 50,
        height: 20,
        count: {
            row: 3,
            col: 12
        },
        offset: {
            top: 50,
            left: 70
        },
        padding: 10
    }
    bricks = game.add.group();
    for (var r = 0; r < brickInfo.count.col; r++) {
        for (var c = 0; c < brickInfo.count.row; c++) {
            // create new brick and add it to group.
            // brickX -> place bricks on a certain left offset --> width + padding from another.
            var brickX = (r*(brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
            // brickY -> place brick on a certain top offset --> height + padding from another.
            var brickY = (c*(brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
            newBrick = game.add.sprite(brickX, brickY, 'brick');
            game.physics.enable(newBrick, Phaser.Physics.ARCADE);
            newBrick.body.immovable = true;
            newBrick.anchor.set(0.5);
            bricks.add(newBrick);
        }        
    }
};

// SCORE +10 for each brick killed
// Kill the brick when ball hits it.
// brick is defined locally within state.
function ballHitBrick(ball, brick) {
    // play wobble animation on hitting brick.
    ball.animations.play('wobble');
    // kill brick
    // onHit - make width / height scale to 0 --> so they will nicely disappear.
    // add.tween() method --> brick.scale argument is what we want to "tween".
    // to() method --> defines object scale upon end tween. 1. ({x:0,y:0}),
    // 2. 200 --> milliseconds time of tween. 3. type of easing for the tween. (Phaser.Easing.Linear.None)
    // brick killed.
    // start() --> starts killing the tween.
    var killTween = game.add.tween(brick.scale);
    killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None);
    // alternatively could user:
    // game.add.tween(brick.scale).to({x:2,y:2}, 500, Phaser.Easing.Elastic.Out, true, 100);
    // optional: onComplete event handler, defines a function to be called upon tween end.
    killTween.onComplete.addOnce(function(){
        brick.kill();
    }, this)
    killTween.start();
    // update score and render.
    score += 10;
    scoreText.setText('Points: ' + score);
    
    // determine WIN State.
    // console.log('bricks.children: ', bricks.children);
    var count_alive = 0;
    // run for the amount of bricks alive
    for (var i = 0; i < bricks.children.length; i++) {
        // Each iteration count how many bricks alive.
        // with the .alive method --> built in phaser.
        if (bricks.children[i].alive == true) {
            console.log('bricks.children[i].alive: ', bricks.children[i].alive);
            count_alive++;    
        }
    }
    // if no more bricks alive, you won.
    if (count_alive == 0) {
        alert('You won the game, congrats!');
        location.reload();
    }
}

function ballLeaveScreen() {
    // upon leaving -1 life.
    lives--;
    // if still have life !== 0
    if(lives) {
        // show curr amount of life
        livesText.setText('Lives: ' + lives);
        // show it on screen
        lifeLostText.visible = true;
        // reset ball & paddle location to default.
        ball.reset(game.world.width*0.5, game.world.height-25);
        paddle.reset(game.world.width*0.5, game.world.height-5);
        // upon click / touch game continues, message hidden, ball moves.
        // addOnce() method --> remove the message from screen ONLY ONCE.
        game.input.onDown.addOnce(function(){
            lifeLostText.visible = false;
            ball.body.velocity.set(150, -150);
        }, this);
    }
    else {
        alert('You lost, game over!');
        location.reload();
    }
}

function ballHitPaddle(ball, paddle) {
    ball.animations.play('wobble');
    // whenever the ball hits more far than the center point of the paddle it's velocity will increase.
    // also the direction of the ball rebounce is determined by the place it will hit.
    ball.body.velocity.x = -1 * 5 * (paddle.x - ball.x)
}

function startGame() {
    // remove button, set ball velocuty, playing === true.
    startButton.destroy();
    ball.body.velocity.set(150, 150);
    playing = true;
}