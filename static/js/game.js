class StartScene extends Phaser.Scene {
  constructor() { super('StartScene'); }

  preload() {
    this.load.image('dino', '/static/assets/dino.png');
    this.load.image('cactus', '/static/assets/cactus.png');
  }

  create() {
    this.bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x8ecae6).setOrigin(0);

    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(100, this.scale.width - 100);
      const y = Phaser.Math.Between(50, 250);
      const w = Phaser.Math.Between(120, 200);
      const h = Phaser.Math.Between(30, 60);
      this.add.rectangle(x, y, w, h, 0xffffff, 0.9).setAngle(Phaser.Math.Between(-3, 3));
    }

    this.add.text(this.scale.width / 2, this.scale.height / 2,
      "🖐️ Otwórz dłoń, aby rozpocząć grę",
      { fontSize: '36px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'sans-serif' })
      .setOrigin(0.5);

    document.addEventListener('handJump', () => {
      this.scene.start('GameScene');
    }, { once: true });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.jumpListener = null;
  }

  preload() {
    this.load.image('dino', '/static/assets/dino.png');
    this.load.image('cactus', '/static/assets/cactus.png');
  }

  create() {
    this.bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x8ecae6).setOrigin(0);

    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(50, 250);
      const w = Phaser.Math.Between(100, 180);
      const h = Phaser.Math.Between(30, 50);
      const cloud = this.add.rectangle(x, y, w, h, 0xffffff, 0.9);
      cloud.speed = Phaser.Math.FloatBetween(0.1, 0.4);
      this.clouds.push(cloud);
    }

    this.ground = this.add.rectangle(0, this.scale.height - 80, this.scale.width, 80, 0x7cb518).setOrigin(0);
    this.physics.add.existing(this.ground, true);

    const playerY = this.scale.height - 80;
    this.player = this.physics.add.sprite(150, playerY, 'dino').setScale(0.10);
    this.player.setOrigin(0.5, 1);
    this.physics.add.collider(this.player, this.ground);

    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.hit, null, this);

    this.score = 0;
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff', fontFamily: 'sans-serif' });

    this.jumpListener = () => this.jump();
    document.addEventListener('handJump', this.jumpListener);

    this.events.on('shutdown', () => {
      if (this.jumpListener) {
        document.removeEventListener('handJump', this.jumpListener);
      }
    });

    this.lastSpawn = 0;
    this.speed = 400;
    this.spawnMin = 1800;
    this.spawnMax = 2400;
    this.spawnInterval = Phaser.Math.Between(this.spawnMin, this.spawnMax);
    this.scoreThreshold = 100;
  }

  update(time, delta) {
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed * delta * 0.5;
      if (cloud.x < -200) cloud.x = this.scale.width + 200;
    }

    if (time - this.lastSpawn > this.spawnInterval) {
      this.spawnObstacle();
      this.lastSpawn = time;
      this.spawnInterval = Phaser.Math.Between(this.spawnMin, this.spawnMax);
    }

    this.obstacles.children.iterate(obstacle => {
      if (obstacle && obstacle.x < -100) {
        obstacle.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.score >= this.scoreThreshold) {
          this.increaseDifficulty();
          this.scoreThreshold += 100;
        }
      }
    });
  }

  jump() {
    if (this.player.body.touching.down) {
      this.player.setVelocityY(-750);
    }
  }

  spawnObstacle() {
    const yPos = this.scale.height - 50;
    const obstacle = this.add.sprite(this.scale.width + 50, yPos, 'cactus');
    this.physics.add.existing(obstacle);
    this.obstacles.add(obstacle);
    obstacle.setOrigin(0.5, 1);
    obstacle.setScale(0.08);
    obstacle.body.setSize(50, 100);
    obstacle.body.setAllowGravity(false);
    obstacle.body.setVelocityX(-this.speed);
    obstacle.body.setImmovable(true);
  }

  increaseDifficulty() {
    this.speed += 50;
    this.spawnMin = Math.max(1200, this.spawnMin - 100);
    this.spawnMax = Math.max(1600, this.spawnMax - 100);

    this.obstacles.children.iterate(obstacle => {
      if (obstacle) {
        obstacle.body.setVelocityX(-this.speed);
      }
    });

    let msg = this.add.text(this.scale.width / 2, this.scale.height / 3,
      'SPEED UP!',
      { fontSize: '40px', color: '#ff0000', fontStyle: 'bold', fontFamily: 'sans-serif' })
      .setOrigin(0.5);

    this.time.delayedCall(1000, () => msg.destroy());
  }

  hit() {
    this.scene.pause();
    if (this.jumpListener) {
      document.removeEventListener('handJump', this.jumpListener);
    }

    this.add.text(this.scale.width / 2, this.scale.height / 2,
      '💀 Koniec gry!\nOtwórz dłoń, by zagrać ponownie',
      { fontSize: '28px', color: '#fff', align: 'center', fontFamily: 'sans-serif' })
      .setOrigin(0.5);

    document.addEventListener('handJump', () => this.scene.restart(), { once: true });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#8ecae6',
  physics: { 
    default: 'arcade', 
    arcade: { 
      gravity: { y: 1200 }, 
      debug: false
    } 
  },
  scene: [StartScene, GameScene]
};

new Phaser.Game(config);
