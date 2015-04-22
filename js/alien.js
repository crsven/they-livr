Alien = function() {
  this.health = 100;
};

Alien.prototype.build = function() {
  var material = new THREE.MeshLambertMaterial({
                   map: THREE.ImageUtils.loadTexture('img_src/alien.jpg')
                 });
  var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.alien = this;
  return mesh;
};

Alien.prototype.takeHit = function() {
  this.health -= 1;
};

Alien.prototype.dead = function() {
  return this.health <= 0;
};
