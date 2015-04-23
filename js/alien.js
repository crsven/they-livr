Alien = function() {
  this.health = 100;
  this.alienFace = new THREE.MeshLambertMaterial({
                     map: THREE.ImageUtils.loadTexture('img_src/alien.jpg')
                   });
  this.roddyFace = new THREE.MeshLambertMaterial({
                     map: THREE.ImageUtils.loadTexture('img_src/roddy.png')
                   });
};

Alien.prototype.build = function() {
  this.isAlien = (Math.random() >= 0.4);
  var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  this.mesh = new THREE.Mesh(geometry, this.roddyFace);
  this.mesh.alien = this;
  this.mesh.position.x = (Math.random() * (5 - 2) + 2);
  this.mesh.position.y = 0.2;
  this.mesh.position.z = (Math.random() * (5 - 2) + 2);
  if((Math.random() * (100 - 1) + 1) > 50) {
    this.mesh.position.x = -this.mesh.position.x;
  }
  if((Math.random() * (100 - 1) + 1) > 50) {
    this.mesh.position.z = -this.mesh.position.z;
  }

  this.mesh.lookAt(new THREE.Vector3(0,0,0));
  return this.mesh;
};

Alien.prototype.takeHit = function() {
  if(this.mesh.material !== this.alienFace) {
    this.mesh.material = this.alienFace;
  }
  this.mesh.translateOnAxis(this.mesh.worldToLocal(new THREE.Vector3(0,0,0)),-0.003);
  this.health -= 1;
};

Alien.prototype.advance = function() {
  this.mesh.translateOnAxis(this.mesh.worldToLocal(new THREE.Vector3(0,0,0)),0.001);
};

Alien.prototype.isDead = function() {
  return this.health <= 0;
};
