// GLOBALS
const canvas = document.getElementById('game-window'); 
const ctx = canvas.getContext('2d');
const gameWidth = canvas.width; 
const gameHeight = canvas.height;
const midPointCanvas = {
    x: gameWidth / 2,
    y: gameHeight / 2
}

class Ship {
    constructor() {
        // Positioning
        this.position = midPointCanvas;
        this.angle = 0;
        
        // Control states
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
        this.isThrusting = false;
        
        // Movement properties
        this.rotationSpeed = 0.05;  // in radians
        this.thrust = 0.1;          // acceleration rate
        this.friction = 0.99;       // deceleration rate
        this.xVelocity = 0;         // X velocity
        this.yVelocity = 0;         // Y velocity
    }

    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        
        // Draw ship
        ctx.beginPath();
        ctx.strokeStyle = 'white';  
        ctx.moveTo(0, -10);  // Top 
        ctx.lineTo(10, 18);  // Bottom right
        ctx.lineTo(0, 13);   // Middle 
        ctx.lineTo(-10, 18); // Bottom left
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }

    keyDown(event) {
        switch (event.key) {
            case 'ArrowLeft':
                this.isRotatingLeft = true;
                break;
            case 'ArrowRight':
                this.isRotatingRight = true;
                break;
            case 'ArrowUp':
                this.isThrusting = true;
                break;
        }
    }

    keyUp(event) {
        switch (event.key) {
            case 'ArrowLeft':
                this.isRotatingLeft = false;
                break;
            case 'ArrowRight':
                this.isRotatingRight = false;
                break;
            case 'ArrowUp':
                this.isThrusting = false;
                break;
        }
    }

    rotate() {
        if (this.isRotatingLeft) this.angle -= this.rotationSpeed;
        if (this.isRotatingRight) this.angle += this.rotationSpeed;
    }

    move() {
        // Apply thrust 
        if (this.isThrusting) {
            this.xVelocity += Math.cos(this.angle - Math.PI/2) * this.thrust;
            this.yVelocity += Math.sin(this.angle - Math.PI/2) * this.thrust;
        }
        
        // Apply friction 
        this.xVelocity *= this.friction;
        this.yVelocity *= this.friction;
        
        // Update position
        this.position.x += this.xVelocity;
        this.position.y += this.yVelocity;
        
        // Wrap around screen
        if (this.position.x > gameWidth) this.position.x = 0;
        if (this.position.x < 0) this.position.x = gameWidth;
        if (this.position.y > gameHeight) this.position.y = 0;
        if (this.position.y < 0) this.position.y = gameHeight;
    }

    update() {
        this.rotate();
        this.move();
        this.draw();
    }
}












const ship = new Ship();

// Game loop
function gameLoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    ship.update();
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => ship.keyDown(e));
document.addEventListener('keyup', (e) => ship.keyUp(e));

window.onload = () => {
    gameLoop();
};
