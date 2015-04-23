var AlienHunter = {};

AlienHunter.initialize = function(alienCount) {
  //Setup three.js WebGL renderer
  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.renderer.setPixelRatio(window.devicePixelRatio);

  // Append the canvas element created by the renderer to document body element.
  document.body.appendChild(this.renderer.domElement);

  // Create a three.js scene.
  this.scene = new THREE.Scene();

  // Create a three.js camera.
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.3, 10000);

  // Apply VR headset positional data to camera.
  this.controls = new THREE.VRControls(this.camera);

  // Apply VR stereo rendering to renderer.
  this.effect = new THREE.VREffect(this.renderer);
  this.effect.setSize(window.innerWidth, window.innerHeight);

  // Create a VR manager helper to enter and exit VR mode.
  this.manager = new WebVRManager(this.renderer, this.effect);

  this.score = 0;
  this.alienMeshes = [];
  if(!alienCount) { alienCount = 5; }
  for(var i = 0;i<alienCount;i++) {
    this.alienMeshes.push(new Alien().build());
  }

  this.alienMeshes.forEach(function(alien) {
    this.scene.add(alien);
  }.bind(this));

  var ambientLight = new THREE.AmbientLight(0xbbbbbb);
  this.scene.add(ambientLight);

  this.raycaster = new THREE.Raycaster();
  this.raycaster.precision = 0.0005;

  var floorGeometry = new THREE.PlaneBufferGeometry(5000, 5000, 1, 1);
  var floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        side: THREE.DoubleSide
  });
  var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = Math.PI / -2; // rotate to be flat in the X-Z plane
  floorMesh.position.set(0, -100, 0);
  this.scene.add(floorMesh);

  var wallGeometry = new THREE.PlaneBufferGeometry(10000, 5000, 1, 1);
  var wallMaterial = new THREE.MeshBasicMaterial({
        color: 0x999999,
        side: THREE.DoubleSide
  });

  var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
  wallMesh.rotation.x = Math.PI / -1; // rotate to be flat in the X-Z plane
  wallMesh.position.y = 2000;
  wallMesh.position.z = -5000;
  this.scene.add(wallMesh);

  var wallMesh2 = new THREE.Mesh(wallGeometry, wallMaterial);
  wallMesh2.rotation.x = Math.PI / -1; // rotate to be flat in the X-Z plane
  wallMesh2.position.y = 2000;
  wallMesh2.position.z = 5000;
  this.scene.add(wallMesh2);

  var sideWallMaterial = new THREE.MeshBasicMaterial({
        color: 0x777777,
        side: THREE.DoubleSide
  });
  var wallMesh3 = new THREE.Mesh(wallGeometry, sideWallMaterial);
  wallMesh3.rotation.x = Math.PI / -1; // rotate to be flat in the X-Z plane
  wallMesh3.rotation.y = Math.PI / -2; // rotate to be flat in the X-Z plane
  wallMesh3.position.x = 5000;
  wallMesh3.position.y = 2000;
  this.scene.add(wallMesh3);

  var wallMesh4 = new THREE.Mesh(wallGeometry, sideWallMaterial);
  wallMesh4.rotation.x = Math.PI / -1; // rotate to be flat in the X-Z plane
  wallMesh4.rotation.y = Math.PI / -2; // rotate to be flat in the X-Z plane
  wallMesh4.position.x = -5000;
  wallMesh4.position.y = 2000;
  this.scene.add(wallMesh4);

  var reticleGeometry = new THREE.SphereGeometry(0.02, 32, 32);
  this.reticleGreenMaterial = new THREE.MeshBasicMaterial({color: 0x00fc00});
  this.reticleRedMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
  this.reticleMesh = new THREE.Mesh(reticleGeometry, this.reticleGreenMaterial);
  this.reticleMesh.position.set(1,500,1);
  this.scene.add(this.reticleMesh);

  this.animate = function() {
    var coords = new THREE.Vector2();
    coords.x = 0;
    coords.y = 0;
    this.raycaster.setFromCamera(coords, this.camera);

    var intersections = this.raycaster.intersectObjects(this.alienMeshes);
    if(intersections.length > 0){
      this.reticleMesh.position.copy(intersections[0].point);
      this.reticleMesh.material = this.reticleGreenMaterial;
      var mesh = intersections[0].object;
      var alien = mesh.alien;
      if(alien.isAlien) {
        this.reticleMesh.material = this.reticleRedMaterial;
        alien.takeHit();
        if(alien.isDead()) {
          this.score += 1;
          var index = this.alienMeshes.indexOf(mesh);
          this.alienMeshes.splice(index, 1);
          this.scene.remove(mesh);
        }
      }
    } else {
      this.camera.updateProjectionMatrix();
      var zCamVec = new THREE.Vector3(0,0,-1);
      var position = this.camera.localToWorld(zCamVec);
      this.reticleMesh.position.set(position.x, position.y, position.z);
      this.reticleMesh.lookAt(this.camera.position);
      this.reticleMesh.material = this.reticleGreenMaterial;
    }

    var aliensRemaining = this.alienMeshes.some(function(mesh) {
      return mesh.alien.isAlien;
    });

    if(!aliensRemaining) {
      this.endGame();
    } else {
      var attacked = false;
      this.alienMeshes.forEach(function(mesh) {
        mesh.alien.advance();
        if(this.isAlienAttacking(mesh)) {
          if(mesh.alien.isAlien){
            this.score -= 2;
            attacked = true;
          } else {
            this.scene.remove(mesh);
          }
        };
      }.bind(this));

      if(attacked) {
        this.endGame({dead: true});
      } else {
        // Update VR headset position and apply to camera.
        this.controls.update();

        // Render the scene through the manager.
        this.manager.render(this.scene, this.camera);

        requestAnimationFrame(this.animate.bind(this));
      }
    }
  };

  this.isAlienAttacking = function(alien) {
    return alien.position.distanceTo(this.camera.position) <= 0.7;
  };

  this.endGame = function(options) {
    // Create a three.js scene.
    var endScene = new THREE.Scene();
    if(!this.endTextMesh) {
      var material = new THREE.MeshNormalMaterial();
      var endText = new THREE.TextGeometry('GAME OVER');
      this.endTextMesh = new THREE.Mesh(endText, material);
      this.endTextMesh.position.x = -400;
      this.endTextMesh.position.y = 100;
      this.endTextMesh.position.z = -500;
      this.endTextMesh.rotation.x = 0;
      this.endTextMesh.rotation.y = Math.PI * 2;

      if(options && options.dead && !this.deadTextMesh) {
        var deadText = new THREE.TextGeometry('YOU DIED');
        var deadMaterial = new THREE.MeshLambertMaterial({color: 0xff0000});
        this.deadTextMesh = new THREE.Mesh(deadText, deadMaterial);
        this.deadTextMesh.position.x = -300;
        this.deadTextMesh.position.y = 300;
        this.deadTextMesh.position.z = -500;
        this.deadTextMesh.rotation.x = Math.PI * .25;
        this.deadTextMesh.rotation.y = Math.PI * 2;
      }

      var scoreText = new THREE.TextGeometry('SCORE: ' + this.score);
      this.scoreTextMesh = new THREE.Mesh(scoreText, material);
      this.scoreTextMesh.position.x = -300;
      this.scoreTextMesh.position.y = -100;
      this.scoreTextMesh.position.z = -500;
      this.scoreTextMesh.rotation.x = 0;
      this.scoreTextMesh.rotation.y = Math.PI * 2;
    }

    var ambientLight = new THREE.AmbientLight(0xbbbbbb);
    endScene.add(ambientLight);
    endScene.add(this.endTextMesh);
    endScene.add(this.scoreTextMesh);
    if(this.deadTextMesh) {
      endScene.add(this.deadTextMesh);
    }

    this.controls.update();
    this.manager.render(endScene, this.camera);

    requestAnimationFrame(this.endGame.bind(this));
  };

  this.animate();
};
